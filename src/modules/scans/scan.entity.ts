import { Column, Entity, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../common/app-base.entity';
import { User } from '../users/user.entity';
import { Doctor } from '../doctors/doctor.entity';
import { ScanStatus } from './enums/scan-status.enum';

@Entity({ name: 'scans' })
export class Scan extends AppBaseEntity {

  @Column({ type: 'timestamptz' })
  dateTime: Date;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @Column({ type: 'boolean', default: false })
  isScanned: boolean;

  @Column({
    type: 'enum',
    enum: ScanStatus,
    default: ScanStatus.UNCONFIRMED,
  })
  status: ScanStatus;

  @ManyToOne(() => User, { nullable: false })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  assignedTo: User | null;

  @ManyToOne(() => Doctor, { nullable: false })
  requestedByDoctor: Doctor;
}
