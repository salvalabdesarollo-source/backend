import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AppBaseEntity } from '../../common/app-base.entity';
import { UserRole } from './enum/user-role.enum';


@Entity({ name: 'users' })
export class User extends AppBaseEntity {

  @Column({ unique: true, length: 80 })
  username: string;

  @Column({ length: 200 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Administrator })
  role: UserRole;

  @Column('varchar', { length: 40, nullable: true })
  phone?: string | null;

  @BeforeInsert()
  async hashPasswordOnCreate() {
    if (!this.password) {
      throw new Error('Password is required');
    }
    if (!this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (!this.password) {
      return;
    }
    if (!this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async comparePassword(attempt: string) {
    return await bcrypt.compare(attempt, this.password);
  }

  get generateToken() {
    const { id, username, role } = this;
    return jwt.sign(
      {
        id,
        username,
        role,
      },
      process.env.SECRET_USER ?? '',
    );
  }

  toResponseObject() {
    const { id, createdAt, updatedAt, username, role, phone, generateToken } = this;
    const resp: any = { id, createdAt, updatedAt, username, role, phone };
    resp.token = generateToken;
    return resp;
  } 
}
