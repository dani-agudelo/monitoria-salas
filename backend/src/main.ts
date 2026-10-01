import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

function corsOrigins() {
  const configured = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (configured && configured.length > 0) return configured;
  return ["http://localhost:3000", "http://127.0.0.1:3000"];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: corsOrigins(),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

void bootstrap();
