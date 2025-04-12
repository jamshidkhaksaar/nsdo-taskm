import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/province.entity';

@Injectable()
export class ProvinceService {
  constructor(
    @InjectRepository(Province)
    private provinceRepository: Repository<Province>,
  ) {}

  async create(data: Partial<Province>): Promise<Province> {
    const province = this.provinceRepository.create(data);
    return this.provinceRepository.save(province);
  }

  async findAll(): Promise<Province[]> {
    return this.provinceRepository.find({ relations: ['departments'] });
  }

  async findOne(id: string): Promise<Province> {
    const province = await this.provinceRepository.findOne({
      where: { id },
      relations: ['departments'],
    });
    if (!province) throw new NotFoundException('Province not found');
    return province;
  }

  async update(id: string, data: Partial<Province>): Promise<Province> {
    await this.provinceRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.provinceRepository.delete(id);
  }
}