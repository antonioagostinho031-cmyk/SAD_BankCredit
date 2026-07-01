import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CreditModule } from './modules/credit/credit.module';
import { RiskModule } from './modules/risk/risk.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { DecisionModule } from './modules/decision/decision.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProductsModule } from './modules/products/products.module';
import { DatabaseModule } from './database/database.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    DocumentsModule,
    CreditModule,
    RiskModule,
    ScoringModule,
    DecisionModule,
    ReportsModule,
    AuditModule,
    NotificationsModule,
    DashboardModule,
    ProductsModule,
  ],
})
export class AppModule {}
