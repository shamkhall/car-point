import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CarPointService } from './car-point.service.js';
import { CarPointRequestDto } from './dto/car-point-request.dto.js';
import { CarPointResponseDto } from './dto/car-point-response.dto.js';

@Controller()
export class CarPointController {
  constructor(private readonly carPointService: CarPointService) {}

  @GrpcMethod('CarPointService', 'GetCarPoint')
  async getCarPoint(request: CarPointRequestDto): Promise<CarPointResponseDto> {
    return this.carPointService.getCarPoint(request);
  }
}
