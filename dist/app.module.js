"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const app_controller_1 = require("./app.controller");
const auth_controller_1 = require("./auth.controller");
const root_controller_1 = require("./root.controller");
const app_service_1 = require("./app.service");
const scan_history_service_1 = require("./scan-history.service");
const scan_history_schema_1 = require("./scan-history.schema");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRootAsync({
                useFactory: () => ({
                    uri: process.env.MONGODB_URI,
                }),
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: scan_history_schema_1.ScanHistory.name, schema: scan_history_schema_1.ScanHistorySchema },
            ]),
        ],
        controllers: [app_controller_1.AppController, auth_controller_1.AuthController, root_controller_1.RootController],
        providers: [app_service_1.AppService, scan_history_service_1.ScanHistoryService],
        exports: [scan_history_service_1.ScanHistoryService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map