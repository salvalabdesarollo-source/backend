import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';
import { Doctor } from './doctor.entity';
import { DoctorsService } from './doctors.service';
import { UserAuthGuard } from '../../core/guards/user-auth.guard';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Crud({
  model: {
    type: Doctor,
  },
  dto: {
    create: CreateDoctorDto,
    update: UpdateDoctorDto,
    replace: UpdateDoctorDto,
  },
  query: {
    join: {
      clinic: {
        eager: true,
      },
    },
    sort: [
      {
        field: 'createdAt',
        order: 'DESC',
      },
    ],
  },
  routes: {
    getManyBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    getOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    createOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    createManyBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    updateOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    replaceOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    deleteOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
  },
})
@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController implements CrudController<Doctor> {
  constructor(public service: DoctorsService) {}
}
