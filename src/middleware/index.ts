import { INestApplication, ValidationPipe } from '@nestjs/common';
import { configureSwagger } from './swagger';

export const configureMiddleware = async (app: INestApplication) => {
  /* Add validation */
  app.useGlobalPipes(new ValidationPipe());
  /* Enable endpoint versioning  */
  await app.enableVersioning();
  /* Generate Swagger documentation */
  await configureSwagger(app);
};
