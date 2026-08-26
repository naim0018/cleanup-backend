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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const scan_history_service_1 = require("./scan-history.service");
const operators_1 = require("rxjs/operators");
const axios_1 = __importDefault(require("axios"));
let AppController = class AppController {
    appService;
    scanHistoryService;
    constructor(appService, scanHistoryService) {
        this.appService = appService;
        this.scanHistoryService = scanHistoryService;
    }
    extractToken(authHeader) {
        const token = authHeader?.replace('Bearer ', '')?.replace('token ', '')?.trim() || process.env.GITHUB_DEFAULT_TOKEN;
        if (!token) {
            throw new common_1.HttpException('GitHub authentication token is required.', common_1.HttpStatus.UNAUTHORIZED);
        }
        return token;
    }
    getHeaders(token) {
        return {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'NestJS-Malware-Guard',
        };
    }
    async getRepos(authHeader) {
        const token = this.extractToken(authHeader);
        return this.appService.listRepositories(token);
    }
    async getOrgs(authHeader) {
        const token = this.extractToken(authHeader);
        return this.appService.listOrgs(token);
    }
    async scanRepo(fullName, repoId, githubLogin, authHeader) {
        if (!fullName) {
            throw new common_1.HttpException('fullName query parameter is required.', common_1.HttpStatus.BAD_REQUEST);
        }
        const token = this.extractToken(authHeader);
        return this.appService.scanRepository(token, fullName, githubLogin, repoId ? parseInt(repoId) : undefined);
    }
    scanEvents(fullName) {
        return this.appService.scanLog$.asObservable().pipe((0, operators_1.filter)((log) => log.repo === fullName), (0, operators_1.map)((log) => ({ data: log })));
    }
    async cleanFile(body, authHeader) {
        const { fullName, filePath, sha, cleanedCode, deleteFilePath, githubLogin, repoId, malwareType, severity } = body;
        if (!fullName || !filePath || !cleanedCode) {
            throw new common_1.HttpException('fullName, filePath and cleanedCode are required inside body.', common_1.HttpStatus.BAD_REQUEST);
        }
        const token = this.extractToken(authHeader);
        return this.appService.cleanFile(token, fullName, filePath, sha, cleanedCode, deleteFilePath, githubLogin, repoId, malwareType, severity);
    }
    async getHistory(githubLogin) {
        if (!githubLogin) {
            throw new common_1.HttpException('githubLogin query parameter is required.', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.scanHistoryService.getHistory(githubLogin);
    }
    async getRateLimit(authHeader) {
        const token = this.extractToken(authHeader);
        try {
            const res = await axios_1.default.get('https://api.github.com/rate_limit', {
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
        }
        catch (error) {
            throw new common_1.HttpException(error.response?.data?.message || 'Failed to fetch rate limit.', error.response?.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('repos'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getRepos", null);
__decorate([
    (0, common_1.Get)('orgs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOrgs", null);
__decorate([
    (0, common_1.Get)('scan'),
    __param(0, (0, common_1.Query)('fullName')),
    __param(1, (0, common_1.Query)('repoId')),
    __param(2, (0, common_1.Query)('githubLogin')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "scanRepo", null);
__decorate([
    (0, common_1.Get)('scan-events'),
    (0, common_1.Header)('Content-Type', 'text/event-stream'),
    (0, common_1.Header)('Cache-Control', 'no-cache'),
    (0, common_1.Header)('Connection', 'keep-alive'),
    __param(0, (0, common_1.Query)('fullName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "scanEvents", null);
__decorate([
    (0, common_1.Post)('clean'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "cleanFile", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Query)('githubLogin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('rate-limit'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getRateLimit", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('github'),
    __metadata("design:paramtypes", [app_service_1.AppService,
        scan_history_service_1.ScanHistoryService])
], AppController);
//# sourceMappingURL=app.controller.js.map