import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';
import { Clinic } from './clinic.entity';

@Injectable()
export class ClinicsService extends TypeOrmCrudService<Clinic> {
  constructor(@InjectRepository(Clinic) repo: Repository<Clinic>) {
    super(repo);
  }
}
