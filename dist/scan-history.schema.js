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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanHistorySchema = exports.ScanHistory = exports.CleanedFile = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let CleanedFile = class CleanedFile {
    filePath;
    malwareType;
    severity;
    cleanedAt;
};
exports.CleanedFile = CleanedFile;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CleanedFile.prototype, "filePath", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CleanedFile.prototype, "malwareType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CleanedFile.prototype, "severity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], CleanedFile.prototype, "cleanedAt", void 0);
exports.CleanedFile = CleanedFile = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CleanedFile);
let ScanHistory = class ScanHistory {
    githubLogin;
    repoId;
    fullName;
    filesScanned;
    threatsFound;
    threatsCleaned;
    status;
    archived;
    cleanedFiles;
    threats;
    lastScanDate;
};
exports.ScanHistory = ScanHistory;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], ScanHistory.prototype, "githubLogin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Number)
], ScanHistory.prototype, "repoId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ScanHistory.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ScanHistory.prototype, "filesScanned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ScanHistory.prototype, "threatsFound", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], ScanHistory.prototype, "threatsCleaned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'idle', enum: ['idle', 'scanned', 'cleaned'] }),
    __metadata("design:type", String)
], ScanHistory.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ScanHistory.prototype, "archived", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ filePath: String, malwareType: String, severity: String, cleanedAt: Date }], default: [] }),
    __metadata("design:type", Array)
], ScanHistory.prototype, "cleanedFiles", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], ScanHistory.prototype, "threats", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], ScanHistory.prototype, "lastScanDate", void 0);
exports.ScanHistory = ScanHistory = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ScanHistory);
exports.ScanHistorySchema = mongoose_1.SchemaFactory.createForClass(ScanHistory);
exports.ScanHistorySchema.index({ githubLogin: 1, repoId: 1 }, { unique: true });
//# sourceMappingURL=scan-history.schema.js.map