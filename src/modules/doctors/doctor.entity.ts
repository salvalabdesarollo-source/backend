import { Column, Entity, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/app-base.entity';
import { Clinic } from '../clinics/clinic.entity';

@Entity({ name: 'doctors' })
export class Doctor extends AppBaseEntity {

  @Column({ length: 120 })
  name: string;

  @Column({ length: 40 })
  phone: string;

  @ManyToOne(() => Clinic, (clinic) => clinic.doctors, { nullable: false })
  clinic: Clinic;
}
