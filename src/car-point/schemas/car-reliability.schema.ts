import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CarReliabilityDocument = HydratedDocument<CarReliability>;

@Schema({ collection: 'car_reliability' })
export class CarReliability {
  @Prop({ required: true, index: true })
  brand: string;

  @Prop({ index: true })
  model: string;

  @Prop({ required: true, enum: ['S', 'A', 'B', 'C', 'D'] })
  tier: string;
}

export const CarReliabilitySchema = SchemaFactory.createForClass(CarReliability);
CarReliabilitySchema.index({ brand: 1, model: 1 }, { unique: true });
