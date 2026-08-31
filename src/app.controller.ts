import { Controller, Get, Post, Body, Headers, Query, HttpException, HttpStatus, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { ScanHistoryService } from './scan-history.service';
import { map, filter } from 'rxjs/operators';
import axios from 'axios';

@Controller('github')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly scanHistoryService: ScanHistoryService,
  ) {}

  private extractToken(authHeader?: string): string {
    const token = authHeader?.replace('Bearer ', '')?.replace('token ', '')?.trim() || process.env.GITHUB_DEFAULT_TOKEN;
    if (!token) {
      throw new HttpException('GitHub authentication token is required.', HttpStatus.UNAUTHORIZED);
    }
    return token;
  }

  private getHeaders(token: string) {
    return {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'NestJS-Malware-Guard',
    };
  }

  @Get('repos')
  async getRepos(@Headers('authorization') authHeader?: string) {
    const token = this.extractToken(authHeader);
    return this.appService.listRepositories(token);
  }

  @Get('orgs')
  async getOrgs(@Headers('authorization') authHeader?: string) {
    const token = this.extractToken(authHeader);
    return this.appService.listOrgs(token);
  }

  @Get('scan')
  async scanRepo(
    @Query('fullName') fullName: string,
    @Query('repoId') repoId: string,
    @Query('githubLogin') githubLogin: string,
    @Headers('authorization') authHeader?: string,
  ) {
    if (!fullName) {
      throw new HttpException('fullName query parameter is required.', HttpStatus.BAD_REQUEST);
    }
    const token = this.extractToken(authHeader);
    return this.appService.scanRepository(token, fullName, githubLogin, repoId ? parseInt(repoId) : undefined);
  }

  @Get('scan-events')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  scanEvents(@Query('fullName') fullName: string) {
    return this.appService.scanLog$.asObservable().pipe(
      filter((log) => log.repo === fullName),
      map((log) => ({ data: log })),
    );
  }

  @Post('clean')
  async cleanFile(
    @Body() body: {
      fullName: string;
      filePath: string;
      sha: string;
      cleanedCode: string;
      deleteFilePath?: string;
      githubLogin?: string;
      repoId?: number;
      malwareType?: string;
      severity?: string;
    },
    @Headers('authorization') authHeader?: string,
  ) {
    const { fullName, filePath, sha, cleanedCode, deleteFilePath, githubLogin, repoId, malwareType, severity } = body;
    if (!fullName || !filePath || !cleanedCode) {
      throw new HttpException('fullName, filePath and cleanedCode are required inside body.', HttpStatus.BAD_REQUEST);
    }
    const token = this.extractToken(authHeader);
    return this.appService.cleanFile(token, fullName, filePath, sha, cleanedCode, deleteFilePath, githubLogin, repoId, malwareType, severity);
  }

  @Post('archive')
  async archive(
    @Body() body: {
      githubLogin: string;
      repoId: number;
    }
  ) {
    if (!body.githubLogin || !body.repoId) {
      throw new HttpException('githubLogin and repoId are required.', HttpStatus.BAD_REQUEST);
    }
    return this.scanHistoryService.archiveScanRecord(body.githubLogin, body.repoId);
  }

  @Get('history')
  async getHistory(@Query('githubLogin') githubLogin: string) {
    if (!githubLogin) {
      throw new HttpException('githubLogin query parameter is required.', HttpStatus.BAD_REQUEST);
    }
    return this.scanHistoryService.getHistory(githubLogin);
  }

  @Get('logs')
  async getLogs(@Query('fullName') fullName: string) {
    if (!fullName) {
      throw new HttpException('fullName query parameter is required.', HttpStatus.BAD_REQUEST);
    }
    return this.appService.getRepoLogs(fullName);
  }

  @Get('rate-limit')
  async getRateLimit(@Headers('authorization') authHeader?: string) {
    const token = this.extractToken(authHeader);
    try {
      const res = await axios.get('https://api.github.com/rate_limit', {
        headers: this.getHeaders(token),
      });
      const core = res.data.resources.core;
      return {
        limit: core.limit,
        used: core.used,
        remaining: core.remaining,
        reset: core.reset,
        resetAt: new Date(core.reset * 1000).toISOString(),
      };
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch rate limit.',
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
