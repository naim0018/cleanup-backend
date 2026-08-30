import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { RootController } from './root.controller';
import { AppService } from './app.service';
import { ScanHistoryService } from './scan-history.service';
import { ScanHistory, ScanHistorySchema } from './scan-history.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),
    MongooseModule.forFeature([
      { name: ScanHistory.name, schema: ScanHistorySchema },
    ]),
  ],
  controllers: [AppController, AuthController, RootController],
  providers: [AppService, ScanHistoryService],
  exports: [ScanHistoryService],
})
export class AppModule {}
