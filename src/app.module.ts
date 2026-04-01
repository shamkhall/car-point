import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarPointModule } from './car-point/car-point.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/car-point'),
    CarPointModule,
  ],
})
export class AppModule {}
