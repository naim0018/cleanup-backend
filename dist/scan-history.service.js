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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanHistoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const scan_history_schema_1 = require("./scan-history.schema");
let ScanHistoryService = class ScanHistoryService {
    scanHistoryModel;
    constructor(scanHistoryModel) {
        this.scanHistoryModel = scanHistoryModel;
    }
    async upsertScanRecord(data) {
        return this.scanHistoryModel.findOneAndUpdate({ githubLogin: data.githubLogin, repoId: data.repoId }, {
            $set: {
                fullName: data.fullName,
                filesScanned: data.filesScanned,
                threatsFound: data.threatsFound,
                status: data.status,
                lastScanDate: new Date(),
                threats: data.threats,
                threatsCleaned: 0,
                cleanedFiles: [],
            },
        }, { upsert: true, new: true });
    }
    async markFileCleaned(data) {
        const doc = await this.scanHistoryModel.findOne({ githubLogin: data.githubLogin, repoId: data.repoId });
        if (!doc)
            return null;
        const threats = doc.threats || [];
        let updated = false;
        for (const t of threats) {
            if (t.filePath === data.filePath && !t.isCleaned) {
                t.isCleaned = true;
                updated = true;
                break;
            }
        }
        const threatsCleaned = (doc.threatsCleaned || 0) + (updated ? 1 : 0);
        const allCleaned = threats.every((t) => t.isCleaned);
        const status = allCleaned ? 'cleaned' : 'scanned';
        return this.scanHistoryModel.findOneAndUpdate({ githubLogin: data.githubLogin, repoId: data.repoId }, {
            $set: {
                threats,
                threatsCleaned,
                status,
            },
            $addToSet: {
                cleanedFiles: {
                    filePath: data.filePath,
                    malwareType: data.malwareType,
                    severity: data.severity,
                    cleanedAt: new Date(),
                },
            },
        }, { new: true });
    }
    async getHistory(githubLogin) {
        return this.scanHistoryModel
            .find({ githubLogin })
            .select('-__v')
            .lean();
    }
};
exports.ScanHistoryService = ScanHistoryService;
exports.ScanHistoryService = ScanHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(scan_history_schema_1.ScanHistory.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ScanHistoryService);
//# sourceMappingURL=scan-history.service.js.map