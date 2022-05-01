import { INestApplication } from '@nestjs/common';
import { configureSwagger } from './swagger';

export const configureMiddleware = async (app: INestApplication) => {
  /* Enable endpoint versioning  */
  await app.enableVersioning();
  /* Generate Swagger documentation */
  await configureSwagger(app);
};
