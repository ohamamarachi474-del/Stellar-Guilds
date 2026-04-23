import { Injectable } from '@nestjs/common';
import { CreateProxylDto } from './dto/create-proxyl.dto';
import { UpdateProxylDto } from './dto/update-proxyl.dto';

@Injectable()
export class ProxylService {
  create(createProxylDto: CreateProxylDto) {
    return 'This action adds a new proxyl';
  }

  findAll() {
    return `This action returns all proxyl`;
  }

  findOne(id: number) {
    return `This action returns a #${id} proxyl`;
  }

  update(id: number, updateProxylDto: UpdateProxylDto) {
    return `This action updates a #${id} proxyl`;
  }

  remove(id: number) {
    return `This action removes a #${id} proxyl`;
  }
}
