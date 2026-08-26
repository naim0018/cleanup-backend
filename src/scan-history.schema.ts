import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScanHistoryDocument = ScanHistory & Document;

@Schema({ timestamps: true })
export class CleanedFile {
  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  malwareType: string;

  @Prop({ required: true })
  severity: string;

  @Prop({ default: Date.now })
  cleanedAt: Date;
}

@Schema({ timestamps: true })
export class ScanHistory {
  @Prop({ required: true, index: true })
  githubLogin: string;

  @Prop({ required: true, index: true })
  repoId: number;

  @Prop({ required: true })
  fullName: string;

  @Prop({ default: 0 })
  filesScanned: number;

  @Prop({ default: 0 })
  threatsFound: number;

  @Prop({ default: 0 })
  threatsCleaned: number;

  @Prop({ default: 'idle', enum: ['idle', 'scanned', 'cleaned'] })
  status: string;

  @Prop({ type: [{ filePath: String, malwareType: String, severity: String, cleanedAt: Date }], default: [] })
  cleanedFiles: CleanedFile[];

  @Prop({ default: Date.now })
  lastScanDate: Date;
}

export const ScanHistorySchema = SchemaFactory.createForClass(ScanHistory);

// Compound index: one record per user per repo
ScanHistorySchema.index({ githubLogin: 1, repoId: 1 }, { unique: true });
