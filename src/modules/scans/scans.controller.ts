import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@dataui/crud';
import { Scan } from './scan.entity';
import { ScansService } from './scans.service';
import { UserAuthGuard } from '../../core/guards/user-auth.guard';
import { CreateScanDto } from './dto/create-scan.dto';
import { UpdateScanDto } from './dto/update-scan.dto';

@Crud({
  model: {
    type: Scan,
  },
  dto: {
    create: CreateScanDto,
    update: UpdateScanDto,
    replace: UpdateScanDto,
  },
  query: {
    join: {
      createdBy: {
        eager: true,
      },
      assignedTo: {
        eager: true,
      },
      requestedByDoctor: {
        eager: true,
      },
      'requestedByDoctor.clinic': {
        eager: true,
      },
    },
    sort: [
      {
        field: 'dateTime',
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
@ApiTags('scans')
@Controller('scans')
export class ScansController implements CrudController<Scan> {
  constructor(public service: ScansService) {}

  @Patch(':id/mark-scanned')
  @ApiBearerAuth()
  @UseGuards(UserAuthGuard)
  async markScanned(@Param('id') id: string): Promise<Scan> {
    return await this.service.markAsScanned(Number(id));
  }

  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({
    name: 'excludeScanId',
    description: 'Exclude scan id when editing',
    required: false,
    type: Number,
  })
  @ApiBearerAuth()
  @UseGuards(UserAuthGuard)
  @Get('occupied-slots')
  async getOccupiedSlots(
    @Query('date') date: string,
    @Query('excludeScanId') excludeScanId?: string,
  ): Promise<string[]> {
    return await this.service.getOccupiedSlots(
      date,
      excludeScanId ? Number(excludeScanId) : undefined,
    );
  }

  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiBearerAuth()
  @UseGuards(UserAuthGuard)
  @Get('by-date')
  async getByDate(@Query('date') date: string): Promise<Scan[]> {
    return await this.service.getScansByDate(date);
  }

  @ApiBearerAuth()
  @UseGuards(UserAuthGuard)
  @Patch(':id/assign/:userId')
  async assignToUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<Scan> {
    return await this.service.assignToUser(Number(id), Number(userId));
  }

  @ApiBearerAuth()
  @UseGuards(UserAuthGuard)
  @Patch(':id/unassign')
  async unassign(@Param('id') id: string): Promise<Scan> {
    return await this.service.unassignUser(Number(id));
  }
}
