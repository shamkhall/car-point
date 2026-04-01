import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CarDepreciationDocument = HydratedDocument<CarDepreciation>;

@Schema({ collection: 'car_depreciation' })
export class CarDepreciation {
  @Prop({ required: true, index: true })
  brand: string;

  @Prop({ required: true, index: true })
  model: string;

  @Prop({ required: true, min: 0, max: 100 })
  retentionPercent: number;
}

export const CarDepreciationSchema = SchemaFactory.createForClass(CarDepreciation);
CarDepreciationSchema.index({ brand: 1, model: 1 }, { unique: true });
