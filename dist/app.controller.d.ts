import { AppService } from './app.service';
import { ScanHistoryService } from './scan-history.service';
export declare class AppController {
    private readonly appService;
    private readonly scanHistoryService;
    constructor(appService: AppService, scanHistoryService: ScanHistoryService);
    private extractToken;
    private getHeaders;
    getRepos(authHeader?: string): Promise<{
        id: any;
        name: any;
        fullName: any;
        description: any;
        stars: any;
        language: any;
        status: string;
        threatsFound: number;
        owner: any;
        ownerType: any;
        private: any;
    }[]>;
    getOrgs(authHeader?: string): Promise<{
        user: {
            login: string;
            type: string;
        };
        orgs: any[];
    }>;
    scanRepo(fullName: string, repoId: string, githubLogin: string, authHeader?: string): Promise<{
        fullName: string;
        filesScanned: number;
        threats: any[];
    }>;
    scanEvents(fullName: string): import("rxjs").Observable<{
        data: {
            repo: string;
            message: string;
            type: "info" | "success" | "warning" | "error";
            progress?: number;
        };
    }>;
    cleanFile(body: {
        fullName: string;
        filePath: string;
        sha: string;
        cleanedCode: string;
        deleteFilePath?: string;
        githubLogin?: string;
        repoId?: number;
        malwareType?: string;
        severity?: string;
    }, authHeader?: string): Promise<{
        success: boolean;
        commitSha: string;
        filePath: string;
    }>;
    archive(body: {
        githubLogin: string;
        repoId: number;
    }): Promise<(import("mongoose").Document<unknown, {}, import("./scan-history.schema").ScanHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./scan-history.schema").ScanHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    getHistory(githubLogin: string): Promise<(import("./scan-history.schema").ScanHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getLogs(fullName: string): Promise<{
        time: string;
        level: string;
        message: string;
        progress?: number;
    }[]>;
    getRateLimit(authHeader?: string): Promise<{
        limit: any;
        used: any;
        remaining: any;
        reset: any;
        resetAt: string;
    }>;
}
