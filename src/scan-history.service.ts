import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScanHistory, ScanHistoryDocument } from './scan-history.schema';

@Injectable()
export class ScanHistoryService {
  constructor(
    @InjectModel(ScanHistory.name)
    private scanHistoryModel: Model<ScanHistoryDocument>,
  ) {}

  async upsertScanRecord(data: {
    githubLogin: string;
    repoId: number;
    fullName: string;
    filesScanned: number;
    threatsFound: number;
    status: string;
  }) {
    return this.scanHistoryModel.findOneAndUpdate(
      { githubLogin: data.githubLogin, repoId: data.repoId },
      {
        $set: {
          fullName: data.fullName,
          filesScanned: data.filesScanned,
          threatsFound: data.threatsFound,
          status: data.status,
          lastScanDate: new Date(),
          // Reset cleanedFiles count when rescanning
          ...(data.status === 'scanned' && data.threatsFound === 0 ? { cleanedFiles: [] } : {}),
        },
      },
      { upsert: true, new: true },
    );
  }

  async markFileCleaned(data: {
    githubLogin: string;
    repoId: number;
    filePath: string;
    malwareType: string;
    severity: string;
  }) {
    return this.scanHistoryModel.findOneAndUpdate(
      { githubLogin: data.githubLogin, repoId: data.repoId },
      {
        $inc: { threatsCleaned: 1 },
        $addToSet: {
          cleanedFiles: {
            filePath: data.filePath,
            malwareType: data.malwareType,
            severity: data.severity,
            cleanedAt: new Date(),
          },
        },
        $set: { status: 'cleaned' },
      },
      { new: true },
    );
  }

  async getHistory(githubLogin: string) {
    return this.scanHistoryModel
      .find({ githubLogin })
      .select('-__v')
      .lean();
  }
}
