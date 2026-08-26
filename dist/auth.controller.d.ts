import type { Response } from 'express';
export declare class AuthController {
    githubAuth(res: Response): Response<any, Record<string, any>> | undefined;
    githubAuthCallback(code: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
