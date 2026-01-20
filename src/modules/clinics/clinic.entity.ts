import { Column, Entity, OneToMany } from 'typeorm';
import { AppBaseEntity } from '../../common/app-base.entity';
import { Doctor } from '../doctors/doctor.entity';

@Entity({ name: 'clinics' })
export class Clinic extends AppBaseEntity {

  @Column({ length: 120 })
  name: string;

  @Column({ length: 200 })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true  })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @OneToMany(() => Doctor, (doctor) => doctor.clinic)
  doctors: Doctor[];
}
