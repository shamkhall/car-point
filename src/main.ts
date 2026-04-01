import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'carpoint',
        protoPath: join(__dirname, '../proto/car-point.proto'),
        url: process.env.GRPC_URL ?? '0.0.0.0:5000',
      },
    },
  );
  await app.listen();
}
bootstrap();
