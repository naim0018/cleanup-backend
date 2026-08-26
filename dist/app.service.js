"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const rxjs_1 = require("rxjs");
const scan_history_service_1 = require("./scan-history.service");
const MALWARE_SIGNATURES = [
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
let AppService = class AppService {
    scanHistoryService;
    scanLog$ = new rxjs_1.Subject();
    constructor(scanHistoryService) {
        this.scanHistoryService = scanHistoryService;
    }
    getHeaders(token) {
        return {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'NestJS-Malware-Guard',
        };
    }
    async listRepositories(token) {
        try {
            let allRepos = [];
            let page = 1;
            let hasMore = true;
            let useTypeAll = true;
            while (hasMore) {
                try {
                    const response = await axios_1.default.get('https://api.github.com/user/repos', {
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
                    }
                    else {
                        page++;
                    }
                }
                catch (error) {
                    if (useTypeAll && error.response?.status === 403) {
                        useTypeAll = false;
                        continue;
                    }
                    throw error;
                }
            }
            return allRepos.map((repo) => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description || 'No description provided.',
                stars: repo.stargazers_count,
                language: repo.language || 'JavaScript',
                status: 'idle',
                threatsFound: 0,
                owner: repo.owner?.login || '',
                ownerType: repo.owner?.type || 'User',
                private: repo.private || false,
            }));
        }
        catch (error) {
            throw new common_1.HttpException(error.response?.data?.message || 'Failed to fetch repositories from GitHub.', error.response?.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async listOrgs(token) {
        try {
            let userLogin = 'Authenticated User';
            try {
                const userRes = await axios_1.default.get('https://api.github.com/user', {
                    headers: this.getHeaders(token),
                });
                userLogin = userRes.data.login;
            }
            catch (e) {
            }
            let orgs = [];
            try {
                const orgsRes = await axios_1.default.get('https://api.github.com/user/orgs', {
                    headers: this.getHeaders(token),
                    params: { per_page: 100 },
                });
                orgs = orgsRes.data.map((org) => ({
                    login: org.login,
                    avatarUrl: org.avatar_url,
                    type: 'Organization',
                }));
            }
            catch (e) {
            }
            return {
                user: { login: userLogin, type: 'User' },
                orgs,
            };
        }
        catch (error) {
            return { user: { login: 'User', type: 'User' }, orgs: [] };
        }
    }
    async scanRepository(token, fullName, githubLogin, repoId) {
        try {
            this.scanLog$.next({ repo: fullName, message: `Fetching repository branch configurations...`, type: 'info' });
            const repoInfo = await axios_1.default.get(`https://api.github.com/repos/${fullName}`, {
                headers: this.getHeaders(token),
            });
            const defaultBranch = repoInfo.data.default_branch || 'main';
            this.scanLog$.next({ repo: fullName, message: `Loading recursive directory structure for tree root...`, type: 'info' });
            const treeResponse = await axios_1.default.get(`https://api.github.com/repos/${fullName}/git/trees/${defaultBranch}?recursive=1`, { headers: this.getHeaders(token) });
            const items = treeResponse.data.tree || [];
            const codeFiles = items.filter((item) => item.type === 'blob');
            const hasGitignore = items.some((item) => item.path === '.gitignore');
            const gitignoreSha = items.find((item) => item.path === '.gitignore')?.sha || '';
            this.scanLog$.next({ repo: fullName, message: `Discovered ${codeFiles.length} JScript/TypeScript files to audit.`, type: 'info' });
            const threats = [];
            let totalFilesScanned = 0;
            const batchSize = 10;
            for (let i = 0; i < codeFiles.length; i += batchSize) {
                const batch = codeFiles.slice(i, i + batchSize);
                await Promise.all(batch.map(async (file) => {
                    try {
                        this.scanLog$.next({ repo: fullName, message: `Auditing code buffer: ${file.path}`, type: 'info' });
                        const filename = file.path.split('/').pop() || '';
                        if (filename.startsWith('.env') && filename !== '.env.example') {
                            this.scanLog$.next({ repo: fullName, message: `⚠️ Exposed environment config leaked: ${file.path}!`, type: 'warning' });
                            let gitignoreContent = '';
                            try {
                                if (hasGitignore) {
                                    const gitignoreData = await axios_1.default.get(`https://api.github.com/repos/${fullName}/contents/.gitignore`, { headers: this.getHeaders(token) });
                                    gitignoreContent = Buffer.from(gitignoreData.data.content, 'base64').toString('utf8');
                                }
                            }
                            catch (e) { }
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
                                deleteFilePath: file.path,
                            });
                            return;
                        }
                        const isSourceCode = file.path.endsWith('.js') ||
                            file.path.endsWith('.jsx') ||
                            file.path.endsWith('.ts') ||
                            file.path.endsWith('.tsx') ||
                            file.path.endsWith('.mjs') ||
                            file.path.endsWith('.cjs');
                        if (!isSourceCode) {
                            totalFilesScanned++;
                            return;
                        }
                        const fileData = await axios_1.default.get(`https://api.github.com/repos/${fullName}/contents/${file.path}`, { headers: this.getHeaders(token) });
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
                                const cleanedContent = content.replace(signature.regex, '').trim();
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
                    }
                    catch (err) {
                    }
                }));
            }
            this.scanLog$.next({ repo: fullName, message: `Repository scan complete. Audited ${totalFilesScanned} files. Detections count: ${threats.length}`, type: 'success' });
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
                }
                catch (e) { }
            }
            return {
                fullName,
                filesScanned: totalFilesScanned,
                threats,
            };
        }
        catch (error) {
            this.scanLog$.next({ repo: fullName, message: `Scan aborted: ${error.message}`, type: 'warning' });
            throw new common_1.HttpException(error.response?.data?.message || 'Failed to scan repository contents.', error.response?.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async cleanFile(token, fullName, filePath, sha, cleanedCode, deleteFilePath, githubLogin, repoId, malwareType, severity) {
        try {
            this.scanLog$.next({ repo: fullName, message: `Patching files: Updating ${filePath}...`, type: 'info' });
            let commitSha = '';
            const response = await axios_1.default.put(`https://api.github.com/repos/${fullName}/contents/${filePath}`, {
                message: `security: patch malware/vulnerability leaks in ${filePath}`,
                content: Buffer.from(cleanedCode, 'utf8').toString('base64'),
                sha: sha || undefined,
            }, {
                headers: this.getHeaders(token),
            });
            commitSha = response.data.commit.sha;
            if (deleteFilePath) {
                this.scanLog$.next({ repo: fullName, message: `Removing leaked config file from repository: ${deleteFilePath}...`, type: 'warning' });
                const fileData = await axios_1.default.get(`https://api.github.com/repos/${fullName}/contents/${deleteFilePath}`, { headers: this.getHeaders(token) });
                await axios_1.default.delete(`https://api.github.com/repos/${fullName}/contents/${deleteFilePath}`, {
                    headers: this.getHeaders(token),
                    data: {
                        message: `security: remove exposed configuration file ${deleteFilePath}`,
                        sha: fileData.data.sha,
                    },
                });
            }
            this.scanLog$.next({ repo: fullName, message: `Clean task complete. Reference commit: ${commitSha.substring(0, 8)}`, type: 'success' });
            if (githubLogin && repoId) {
                try {
                    await this.scanHistoryService.markFileCleaned({
                        githubLogin,
                        repoId,
                        filePath,
                        malwareType: malwareType || 'Unknown',
                        severity: severity || 'medium',
                    });
                }
                catch (e) { }
            }
            return {
                success: true,
                commitSha,
                filePath,
            };
        }
        catch (error) {
            this.scanLog$.next({ repo: fullName, message: `Remediation failed: ${error.message}`, type: 'warning' });
            throw new common_1.HttpException(error.response?.data?.message || 'Failed to patch file contents on GitHub.', error.response?.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scan_history_service_1.ScanHistoryService])
], AppService);
//# sourceMappingURL=app.service.js.map