import { Document } from 'mongoose';
export type ScanHistoryDocument = ScanHistory & Document;
export declare class CleanedFile {
    filePath: string;
    malwareType: string;
    severity: string;
    cleanedAt: Date;
}
export declare class ScanHistory {
    githubLogin: string;
    repoId: number;
    fullName: string;
    filesScanned: number;
    threatsFound: number;
    threatsCleaned: number;
    status: string;
    archived: boolean;
    cleanedFiles: CleanedFile[];
    threats: any[];
    lastScanDate: Date;
}
export declare const ScanHistorySchema: import("mongoose").Schema<ScanHistory, import("mongoose").Model<ScanHistory, any, any, any, any, any, ScanHistory>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ScanHistory, Document<unknown, {}, ScanHistory, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    githubLogin?: import("mongoose").SchemaDefinitionProperty<string, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    repoId?: import("mongoose").SchemaDefinitionProperty<number, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    fullName?: import("mongoose").SchemaDefinitionProperty<string, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    filesScanned?: import("mongoose").SchemaDefinitionProperty<number, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    threatsFound?: import("mongoose").SchemaDefinitionProperty<number, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    threatsCleaned?: import("mongoose").SchemaDefinitionProperty<number, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    archived?: import("mongoose").SchemaDefinitionProperty<boolean, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    cleanedFiles?: import("mongoose").SchemaDefinitionProperty<CleanedFile[], ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    threats?: import("mongoose").SchemaDefinitionProperty<any[], ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastScanDate?: import("mongoose").SchemaDefinitionProperty<Date, ScanHistory, Document<unknown, {}, ScanHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ScanHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, ScanHistory>;
