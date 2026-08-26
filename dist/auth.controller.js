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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
let AuthController = class AuthController {
    githubAuth(res) {
        const clientId = process.env.GITHUB_CLIENT_ID;
        if (!clientId) {
            return res.status(500).send('GITHUB_CLIENT_ID is not configured in the backend environment.');
        }
        const redirectUri = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,read:org,user`;
        res.redirect(redirectUri);
    }
    async githubAuthCallback(code, res) {
        if (!code) {
            return res.status(400).send('No authorization code provided by GitHub.');
        }
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return res.status(500).send('GitHub OAuth credentials are not configured.');
        }
        try {
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                }),
            });
            const data = await response.json();
            if (data.error) {
                return res.status(400).send(`GitHub OAuth Error: ${data.error_description || data.error}`);
            }
            const accessToken = data.access_token;
            if (!accessToken) {
                return res.status(400).send('Failed to obtain access token from GitHub.');
            }
            return res.redirect(`http://localhost:5173/login?token=${accessToken}`);
        }
        catch (err) {
            return res.status(500).send(`Internal Server Error during token exchange: ${err.message}`);
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('github'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "githubAuth", null);
__decorate([
    (0, common_1.Get)('github/callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "githubAuthCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth')
], AuthController);
//# sourceMappingURL=auth.controller.js.map