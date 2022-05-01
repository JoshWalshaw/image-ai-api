import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BackgroundModule } from '../background/background.module';

@Module({
  imports: [ConfigModule.forRoot(), BackgroundModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
