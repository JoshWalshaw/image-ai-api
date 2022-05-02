import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackgroundRemovalModule } from '../background-removal/background-removal.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    BackgroundRemovalModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
