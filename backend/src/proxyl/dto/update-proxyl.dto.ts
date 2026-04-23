import { PartialType } from '@nestjs/swagger';
import { CreateProxylDto } from './create-proxyl.dto';

export class UpdateProxylDto extends PartialType(CreateProxylDto) {}
