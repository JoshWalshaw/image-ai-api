import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configures Swagger documentation to be generated
 *
 * @param app - An instance of INestApplication, this comes from NestFactory.create() in our root main.ts file.
 */
export const configureSwagger = async (
  app: INestApplication,
): Promise<void> => {
  SwaggerModule.setup(
    'documentation/v1',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Image AI V1 API')
        .setDescription('lorum ipsum abc 123')
        .setVersion('0.1')
        .build(),
      {
        include: [],
      },
    ),
  );
};
