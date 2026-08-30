import { Subject } from 'rxjs';
import { ScanHistoryService } from './scan-history.service';
export declare class AppService {
    private readonly scanHistoryService;
    scanLog$: Subject<{
        repo: string;
        message: string;
        type: "info" | "success" | "warning";
    }>;
    private repoLogs;
    constructor(scanHistoryService: ScanHistoryService);
    addRepoLog(repo: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
    getRepoLogs(repo: string): {
        time: string;
        level: string;
        message: string;
    }[];
    private getHeaders;
    listRepositories(token: string): Promise<{
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
    listOrgs(token: string): Promise<{
        user: {
            login: string;
            type: string;
        };
        orgs: any[];
    }>;
    scanRepository(token: string, fullName: string, githubLogin?: string, repoId?: number): Promise<{
        fullName: string;
        filesScanned: number;
        threats: any[];
    }>;
    cleanFile(token: string, fullName: string, filePath: string, sha: string, cleanedCode: string, deleteFilePath?: string, githubLogin?: string, repoId?: number, malwareType?: string, severity?: string): Promise<{
        success: boolean;
        commitSha: string;
        filePath: string;
    }>;
}
