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
    threats: any[];
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
          threats: data.threats,
          threatsCleaned: 0,
          cleanedFiles: [],
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
    const doc = await this.scanHistoryModel.findOne({ githubLogin: data.githubLogin, repoId: data.repoId });
    if (!doc) return null;

    const threats = doc.threats || [];
    let updated = false;
    for (const t of threats) {
      if (t.filePath === data.filePath && !t.isCleaned) {
        t.isCleaned = true;
        updated = true;
        break; // Mark one matching threat as clean
      }
    }

    const threatsCleaned = (doc.threatsCleaned || 0) + (updated ? 1 : 0);
    const allCleaned = threats.every((t: any) => t.isCleaned);
    const status = allCleaned ? 'cleaned' : 'scanned';

    return this.scanHistoryModel.findOneAndUpdate(
      { githubLogin: data.githubLogin, repoId: data.repoId },
      {
        $set: {
          threats,
          threatsCleaned,
          status,
        },
        $addToSet: {
          cleanedFiles: {
            filePath: data.filePath,
            malwareType: data.malwareType,
            severity: data.severity,
            cleanedAt: new Date(),
          },
        },
      },
      { new: true },
    );
  }

  async archiveScanRecord(githubLogin: string, repoId: number) {
    return this.scanHistoryModel.findOneAndUpdate(
      { githubLogin, repoId },
      { $set: { archived: true } },
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
