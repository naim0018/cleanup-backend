import { Model } from 'mongoose';
import { ScanHistory, ScanHistoryDocument } from './scan-history.schema';
export declare class ScanHistoryService {
    private scanHistoryModel;
    constructor(scanHistoryModel: Model<ScanHistoryDocument>);
    upsertScanRecord(data: {
        githubLogin: string;
        repoId: number;
        fullName: string;
        filesScanned: number;
        threatsFound: number;
        status: string;
        threats: any[];
    }): Promise<import("mongoose").Document<unknown, {}, ScanHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & ScanHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    markFileCleaned(data: {
        githubLogin: string;
        repoId: number;
        filePath: string;
        malwareType: string;
        severity: string;
    }): Promise<(import("mongoose").Document<unknown, {}, ScanHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & ScanHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    getHistory(githubLogin: string): Promise<(ScanHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
