import '@tensorflow/tfjs-node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '~modules/app/app.module';
import { configureMiddleware } from './middleware';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Core');
  const app = await NestFactory.create(AppModule);

  await configureMiddleware(app);

  await app.listen(process.env.APPLICATION_PORT);

  logger.log(
    `Application started, listening on port ${process.env.APPLICATION_PORT}`,
  );
}

(async () => await bootstrap())();
