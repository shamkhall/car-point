import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CarPriceDocument = HydratedDocument<CarPrice>;

@Schema({ collection: 'car_prices' })
export class CarPrice {
  @Prop({ required: true, index: true })
  brand: string;

  @Prop({ required: true, index: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop()
  bodyType: string;

  @Prop()
  engine: string;

  @Prop()
  transmission: string;

  @Prop()
  drive: string;

  @Prop()
  color: string;

  @Prop()
  city: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  mileage: number;
}

export const CarPriceSchema = SchemaFactory.createForClass(CarPrice);
CarPriceSchema.index({ brand: 1, model: 1, year: 1 });
