import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';

@Injectable()
export class DoctorsService extends TypeOrmCrudService<Doctor> {
  constructor(@InjectRepository(Doctor) repo: Repository<Doctor>) {
    super(repo);
  }
}
