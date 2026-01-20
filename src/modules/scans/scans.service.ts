import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';
import type { CrudRequest } from '@dataui/crud';
import { Scan } from './scan.entity';
import { ScansGateway } from './scans.gateway';
import { ScanStatus } from './enums/scan-status.enum';

@Injectable()
export class ScansService extends TypeOrmCrudService<Scan> {
  constructor(
    @InjectRepository(Scan) repo: Repository<Scan>,
    private readonly scansGateway: ScansGateway,
  ) {
    super(repo);
  }

  async createOne(req: CrudRequest, dto: Scan): Promise<Scan> {
    const scan = await super.createOne(req, dto);
    this.scansGateway.emitScanEvent('created', scan);
    return scan;
  }

  async updateOne(req: CrudRequest, dto: Partial<Scan>): Promise<Scan> {
    const scan = await super.updateOne(req, dto);
    this.scansGateway.emitScanEvent('updated', scan);
    this.emitAssignmentEventIfChanged(dto, scan);
    return scan;
  }

  async replaceOne(req: CrudRequest, dto: Scan): Promise<Scan> {
    const scan = await super.replaceOne(req, dto);
    this.scansGateway.emitScanEvent('updated', scan);
    this.emitAssignmentEventIfChanged(dto, scan);
    return scan;
  }

  async markAsScanned(id: number): Promise<Scan> {
    await this.repo
      .createQueryBuilder()
      .update(Scan)
      .set({ isScanned: true })
      .where('id = :id', { id })
      .execute();

    const scan = await this.repo.findOneOrFail({
      where: { id },
      relations: {
        createdBy: true,
        assignedTo: true,
        requestedByDoctor: {
          clinic: true,
        },
      },
    });

    this.scansGateway.emitScanEvent('scanned', scan);
    return scan;
  }

  async getOccupiedSlots(
    date: string,
    excludeScanId?: number,
  ): Promise<string[]> {
    const start = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const query = this.repo
      .createQueryBuilder('scan')
      .select('scan.dateTime', 'dateTime')
      .where('scan.dateTime >= :start AND scan.dateTime < :end', { start, end })
      .andWhere('scan.status != :cancelledStatus', { cancelledStatus: ScanStatus.CANCELLED });

    if (excludeScanId) {
      query.andWhere('scan.id != :excludeScanId', { excludeScanId });
    }

    const rows = await query.getRawMany<{ dateTime: string }>();
    const occupied = new Set<string>();

    for (const row of rows) {
      const time = new Date(row.dateTime).toISOString().slice(11, 16);
      occupied.add(time);
    }

    return Array.from(occupied).sort();
  }

  async getScansByDate(date: string): Promise<Scan[]> {
    const start = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return await this.repo
      .createQueryBuilder('scan')
      .leftJoinAndSelect('scan.createdBy', 'createdBy')
      .leftJoinAndSelect('scan.assignedTo', 'assignedTo')
      .leftJoinAndSelect('scan.requestedByDoctor', 'requestedByDoctor')
      .leftJoinAndSelect('requestedByDoctor.clinic', 'clinic')
      .where('scan.dateTime >= :start AND scan.dateTime < :end', { start, end })
      .orderBy('scan.dateTime', 'DESC')
      .getMany();
  }

  async assignToUser(scanId: number, userId: number): Promise<Scan> {
    if (!Number.isInteger(scanId) || scanId <= 0) {
      throw new BadRequestException('scanId must be a positive number.');
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('userId must be a positive number.');
    }

    await this.repo
      .createQueryBuilder()
      .update(Scan)
      .set({ assignedTo: { id: userId } })
      .where('id = :scanId', { scanId })
      .execute();

    const scan = await this.repo.findOneOrFail({
      where: { id: scanId },
      relations: {
        createdBy: true,
        assignedTo: true,
        requestedByDoctor: {
          clinic: true,
        },
      },
    });

    this.scansGateway.emitScanEvent('assigned', scan);
    return scan;
  }

  async unassignUser(scanId: number): Promise<Scan> {
    if (!Number.isInteger(scanId) || scanId <= 0) {
      throw new BadRequestException('scanId must be a positive number.');
    }

    await this.repo
      .createQueryBuilder()
      .update(Scan)
      .set({ assignedTo: null })
      .where('id = :scanId', { scanId })
      .execute();

    const scan = await this.repo.findOneOrFail({
      where: { id: scanId },
      relations: {
        createdBy: true,
        assignedTo: true,
        requestedByDoctor: {
          clinic: true,
        },
      },
    });

    this.scansGateway.emitScanEvent('unassigned', scan);
    return scan;
  }

  private emitAssignmentEventIfChanged(dto: Partial<Scan>, scan: Scan): void {
    if (!Object.prototype.hasOwnProperty.call(dto, 'assignedTo')) {
      return;
    }

    if (scan.assignedTo) {
      this.scansGateway.emitScanEvent('assigned', scan);
    } else {
      this.scansGateway.emitScanEvent('unassigned', scan);
    }
  }
}
