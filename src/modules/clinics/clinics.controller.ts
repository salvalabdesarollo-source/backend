import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';
import { Clinic } from './clinic.entity';
import { ClinicsService } from './clinics.service';
import { UserAuthGuard } from '../../core/guards/user-auth.guard';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Crud({
  model: {
    type: Clinic,
  },
  dto: {
    create: CreateClinicDto,
    update: UpdateClinicDto,
    replace: UpdateClinicDto,
  },
  query: {
    join: {
      doctors: {
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
@ApiTags('clinics')
@Controller('clinics')
export class ClinicsController implements CrudController<Clinic> {
  constructor(public service: ClinicsService) {}
}
