import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CarSafetyDocument = HydratedDocument<CarSafety>;

@Schema({ collection: 'car_safety' })
export class CarSafety {
  @Prop({ required: true, index: true })
  brand: string;

  @Prop({ required: true, index: true })
  model: string;

  @Prop()
  year: number;

  @Prop({ required: true, min: 1, max: 5 })
  stars: number;
}

export const CarSafetySchema = SchemaFactory.createForClass(CarSafety);
CarSafetySchema.index({ brand: 1, model: 1 });
