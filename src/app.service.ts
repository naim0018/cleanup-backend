import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Subject } from 'rxjs';
import { ScanHistoryService } from './scan-history.service';

interface FileTreeItem {
  path: string;
  type: string;
  sha: string;
  url: string;
}

interface MalwareSignature {
  type: string;
  severity: 'medium' | 'high' | 'critical';
  regex: RegExp;
}

const MALWARE_SIGNATURES: MalwareSignature[] = [
  {
    type: 'Obfuscated Hex Generator Script',
    severity: 'critical',
    regex: /(?:global\.[a-zA-Z0-9_]+\s*=\s*['"][^'"]+['"];\s*)?(?:const|let|var)?\s*_0x[a-f0-9]{4,6}\s*=\s*_0x[a-f0-9]{4,6}\s*;\s*\(function\s*\(_0x[a-f0-9]+[\s\S]*?}\)\(\)\);?/gi,
  },
  {
    type: 'Obfuscated Base64 Injection',
    severity: 'critical',
    regex: /eval\(\s*(?:Buffer\.from|atob|String\.fromCharCode)[^)]+\)/gi,
  },
  {
    type: 'Crypto Miner script injection',
    severity: 'high',
    regex: /CoinHive\.Anonymous|cryptonight\.asm|miner\.start/gi,
  },
  {
    type: 'Credential Exfiltration Backdoor',
    severity: 'critical',
    regex: /fetch\(['"]https?:\/\/(?:exfil|evil|leak|bad-domain)[^'"]+['"]/gi,
  },
];

@Injectable()
export class AppService {
  public scanLog$ = new Subject<{ repo: string; message: string; type: 'info' | 'success' | 'warning' }>();

  constructor(private readonly scanHistoryService: ScanHistoryService) { }

  private getHeaders(token: string) {
    return {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'NestJS-Malware-Guard',
    };
  }


  async listRepositories(token: string) {
    try {
      let allRepos: any[] = [];
      let page = 1;
      let hasMore = true;
      let useTypeAll = true;

      while (hasMore) {
        try {
          const response = await axios.get('https://api.github.com/user/repos', {
            headers: this.getHeaders(token),
            params: {
              sort: 'updated',
              per_page: 100,
              ...(useTypeAll && { type: 'all' }),
              page: page,
            },
          });

          allRepos = allRepos.concat(response.data);
          if (response.data.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        } catch (error: any) {
          // If we hit a 403 with type=all, fallback to default params (fine-grained PAT restriction)
          if (useTypeAll && error.response?.status === 403) {
            useTypeAll = false;
            // retry the current page without type=all
            continue;
          }
          throw error;
        }
      }

      return allRepos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || 'No description provided.',
        stars: repo.stargazers_count,
        language: repo.language || 'JavaScript',
        status: 'idle',
        threatsFound: 0,
        owner: repo.owner?.login || '',
        ownerType: repo.owner?.type || 'User', // 'User' or 'Organization'
        private: repo.private || false,
      }));
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch repositories from GitHub.',
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async listOrgs(token: string) {
    try {
      // Fetch authenticated user login (graceful fail if token lacks user scope)
      let userLogin = 'Authenticated User';
      try {
        const userRes = await axios.get('https://api.github.com/user', {
          headers: this.getHeaders(token),
        });
        userLogin = userRes.data.login;
      } catch (e) {
        // Ignored, token lacks User permissions
      }

      // Fetch orgs (graceful fail if token lacks org scope)
      let orgs: any[] = [];
      try {
        const orgsRes = await axios.get('https://api.github.com/user/orgs', {
          headers: this.getHeaders(token),
          params: { per_page: 100 },
        });
        orgs = orgsRes.data.map((org: any) => ({
          login: org.login,
          avatarUrl: org.avatar_url,
          type: 'Organization',
        }));
      } catch (e) {
        // Ignored, token lacks Organization permissions
      }

      return {
        user: { login: userLogin, type: 'User' },
        orgs,
      };
    } catch (error: any) {
      return { user: { login: 'User', type: 'User' }, orgs: [] };
    }
  }

  async scanRepository(token: string, fullName: string, githubLogin?: string, repoId?: number) {
    try {
      this.scanLog$.next({ repo: fullName, message: `Fetching repository branch configurations...`, type: 'info' });
      // 1. Get default branch first
      const repoInfo = await axios.get(`https://api.github.com/repos/${fullName}`, {
        headers: this.getHeaders(token),
      });
      const defaultBranch = repoInfo.data.default_branch || 'main';

      this.scanLog$.next({ repo: fullName, message: `Loading recursive directory structure for tree root...`, type: 'info' });
      // 2. Fetch Git tree recursively
      const treeResponse = await axios.get(
        `https://api.github.com/repos/${fullName}/git/trees/${defaultBranch}?recursive=1`,
        { headers: this.getHeaders(token) },
      );

      const items: FileTreeItem[] = treeResponse.data.tree || [];
      const codeFiles = items.filter((item) => item.type === 'blob');

      // Check if .gitignore file exists in tree
      const hasGitignore = items.some((item) => item.path === '.gitignore');
      const gitignoreSha = items.find((item) => item.path === '.gitignore')?.sha || '';

      this.scanLog$.next({ repo: fullName, message: `Discovered ${codeFiles.length} JScript/TypeScript files to audit.`, type: 'info' });

      const threats: any[] = [];
      let totalFilesScanned = 0;

      // cap batch concurrency to 10 concurrent requests at a time
      const batchSize = 10;
      for (let i = 0; i < codeFiles.length; i += batchSize) {
        const batch = codeFiles.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (file) => {
            try {
              this.scanLog$.next({ repo: fullName, message: `Auditing code buffer: ${file.path}`, type: 'info' });

              // Handle .env leaks detection
              const filename = file.path.split('/').pop() || '';
              if (filename.startsWith('.env') && filename !== '.env.example') {
                this.scanLog$.next({ repo: fullName, message: `⚠️ Exposed environment config leaked: ${file.path}!`, type: 'warning' });

                // Fetch gitignore to see if we can edit it or create a new one
                let gitignoreContent = '';
                try {
                  if (hasGitignore) {
                    const gitignoreData = await axios.get(
                      `https://api.github.com/repos/${fullName}/contents/.gitignore`,
                      { headers: this.getHeaders(token) },
                    );
                    gitignoreContent = Buffer.from(gitignoreData.data.content, 'base64').toString('utf8');
                  }
                } catch (e) { }

                const hasEnvRule = gitignoreContent.split('\n').some(line => line.trim() === '.env*');
                const cleanGitignore = hasEnvRule
                  ? gitignoreContent
                  : `${gitignoreContent}\n# Exclude local environment configs\n.env*\n`;

                threats.push({
                  id: `threat-${file.sha.substring(0, 8)}`,
                  filePath: hasGitignore ? '.gitignore' : '.env (Move to .gitignore)',
                  malwareType: 'Exposed Environment Secrets Leaked',
                  severity: 'critical',
                  line: 1,
                  matchedPattern: `Found exposed .env config: ${file.path}`,
                  originalCode: gitignoreContent || 'No .gitignore found in repo root.',
                  cleanedCode: cleanGitignore,
                  sha: gitignoreSha || '',
                  isCleaned: false,
                  deleteFilePath: file.path, // Store reference to delete the .env file too
                });
                return;
              }

              // Scan only js, jsx, ts, tsx, mjs, cjs files for malware content code
              const isSourceCode =
                file.path.endsWith('.js') ||
                file.path.endsWith('.jsx') ||
                file.path.endsWith('.ts') ||
                file.path.endsWith('.tsx') ||
                file.path.endsWith('.mjs') ||
                file.path.endsWith('.cjs');

              if (!isSourceCode) {
                totalFilesScanned++;
                return;
              }

              const fileData = await axios.get(
                `https://api.github.com/repos/${fullName}/contents/${file.path}`,
                { headers: this.getHeaders(token) },
              );
              totalFilesScanned++;

              const content = Buffer.from(fileData.data.content, 'base64').toString('utf8');
              const lines = content.split('\n');

              for (const signature of MALWARE_SIGNATURES) {
                if (signature.regex.test(content)) {
                  this.scanLog$.next({ repo: fullName, message: `⚠️ Malicious signature trigger found in ${file.path}! type: ${signature.type}`, type: 'warning' });
                  let matchLine = 1;
                  for (let l = 0; l < lines.length; l++) {
                    if (signature.regex.test(lines[l])) {
                      matchLine = l + 1;
                      break;
                    }
                  }

                  const cleanedContent = content.replace(
                    signature.regex,
                    '',
                  ).trim();

                  threats.push({
                    id: `threat-${file.sha.substring(0, 8)}`,
                    filePath: file.path,
                    malwareType: signature.type,
                    severity: signature.severity,
                    line: matchLine,
                    matchedPattern: content.match(signature.regex)?.[0] || 'Unknown signature signature',
                    originalCode: content,
                    cleanedCode: cleanedContent,
                    sha: fileData.data.sha,
                    isCleaned: false,
                  });
                  break;
                }
              }
            } catch (err) {
              // Ignore file retrieval error
            }
          })
        );
      }

      this.scanLog$.next({ repo: fullName, message: `Repository scan complete. Audited ${totalFilesScanned} files. Detections count: ${threats.length}`, type: 'success' });

      // Persist scan record to MongoDB if service available
      if (githubLogin && typeof repoId === 'number') {
        try {
          await this.scanHistoryService.upsertScanRecord({
            githubLogin,
            repoId,
            fullName,
            filesScanned: totalFilesScanned,
            threatsFound: threats.length,
            status: threats.length > 0 ? 'scanned' : 'cleaned',
          });
        } catch (e) { /* Non-fatal: MongoDB may not be connected yet */ }
      }

      return {
        fullName,
        filesScanned: totalFilesScanned,
        threats,
      };
    } catch (error: any) {
      this.scanLog$.next({ repo: fullName, message: `Scan aborted: ${error.message}`, type: 'warning' });
      throw new HttpException(
        error.response?.data?.message || 'Failed to scan repository contents.',
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async cleanFile(
    token: string,
    fullName: string,
    filePath: string,
    sha: string,
    cleanedCode: string,
    deleteFilePath?: string,
    githubLogin?: string,
    repoId?: number,
    malwareType?: string,
    severity?: string,
  ) {
    try {
      this.scanLog$.next({ repo: fullName, message: `Patching files: Updating ${filePath}...`, type: 'info' });

      let commitSha = '';

      // 1. Update/Create target file (e.g. .gitignore or source code file)
      const response = await axios.put(
        `https://api.github.com/repos/${fullName}/contents/${filePath}`,
        {
          message: `security: patch malware/vulnerability leaks in ${filePath}`,
          content: Buffer.from(cleanedCode, 'utf8').toString('base64'),
          sha: sha || undefined,
        },
        {
          headers: this.getHeaders(token),
        },
      );
      commitSha = response.data.commit.sha;

      // 2. If this was a leaked .env detection, delete the exposed file too
      if (deleteFilePath) {
        this.scanLog$.next({ repo: fullName, message: `Removing leaked config file from repository: ${deleteFilePath}...`, type: 'warning' });

        // Fetch target file SHA to delete it
        const fileData = await axios.get(
          `https://api.github.com/repos/${fullName}/contents/${deleteFilePath}`,
          { headers: this.getHeaders(token) },
        );

        await axios.delete(
          `https://api.github.com/repos/${fullName}/contents/${deleteFilePath}`,
          {
            headers: this.getHeaders(token),
            data: {
              message: `security: remove exposed configuration file ${deleteFilePath}`,
              sha: fileData.data.sha,
            },
          },
        );
      }

      this.scanLog$.next({ repo: fullName, message: `Clean task complete. Reference commit: ${commitSha.substring(0, 8)}`, type: 'success' });

      // Persist cleaned file record to MongoDB
      if (githubLogin && repoId) {
        try {
          await this.scanHistoryService.markFileCleaned({
            githubLogin,
            repoId,
            filePath,
            malwareType: malwareType || 'Unknown',
            severity: severity || 'medium',
          });
        } catch (e) { /* Non-fatal */ }
      }

      return {
        success: true,
        commitSha,
        filePath,
      };
    } catch (error: any) {
      this.scanLog$.next({ repo: fullName, message: `Remediation failed: ${error.message}`, type: 'warning' });
      throw new HttpException(
        error.response?.data?.message || 'Failed to patch file contents on GitHub.',
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}

