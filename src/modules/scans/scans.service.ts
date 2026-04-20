import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import type { CrudRequest } from '@dataui/crud';
import { Scan } from './scan.entity';
import { ScansGateway } from './scans.gateway';
import { ScanStatus } from './enums/scan-status.enum';
import { User } from '../users/user.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Clinic } from '../clinics/clinic.entity';
import { UserRole } from '../users/enum/user-role.enum';

type StatsOverviewRow = {
  totalScans: string;
  completedScans: string;
  pendingScans: string;
  cancelledScans: string;
  confirmedScans: string;
  unconfirmedScans: string;
  assignedScans: string;
  unassignedScans: string;
  unassignedPendingScans: string;
};

type StatsRankingRow = {
  id: string;
  name: string;
  role?: UserRole;
  clinicId?: string | null;
  clinicName?: string | null;
  totalScans: string;
  completedScans: string;
  pendingScans: string;
  cancelledScans: string;
};

type StatsFilters = {
  period?: string;
  startDate?: string;
  endDate?: string;
  clinicId?: number;
  doctorId?: number;
  createdById?: number;
  assignedToId?: number;
};

type StatsDateRange = {
  start: string;
  end: string;
};

@Injectable()
export class ScansService extends TypeOrmCrudService<Scan> {
  constructor(
    @InjectRepository(Scan) repo: Repository<Scan>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Doctor) private readonly doctorsRepository: Repository<Doctor>,
    @InjectRepository(Clinic) private readonly clinicsRepository: Repository<Clinic>,
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

  async getStats(filters: StatsFilters = {}): Promise<Record<string, unknown>> {
    const normalizedFilters = this.normalizeStatsFilters(filters);
    const params = {
      cancelledStatus: ScanStatus.CANCELLED,
      confirmedStatus: ScanStatus.CONFIRMED,
      unconfirmedStatus: ScanStatus.UNCONFIRMED,
    };
    const completedExpr = `CASE WHEN scan."isScanned" = true THEN 1 ELSE 0 END`;
    const pendingExpr = `CASE WHEN scan."isScanned" = false AND scan.status != :cancelledStatus THEN 1 ELSE 0 END`;
    const cancelledExpr = `CASE WHEN scan.status = :cancelledStatus THEN 1 ELSE 0 END`;
    const dateRange = this.resolveStatsDateRange(normalizedFilters);
    const baseQuery = this.buildStatsBaseQuery(normalizedFilters, params, dateRange);

    const [
      overviewRaw,
      totalUsers,
      totalDoctors,
      totalClinics,
      totalAdmins,
      totalScanners,
      doctorRows,
      doctorCancelledRows,
      clinicRows,
      adminRows,
      scannerRows,
    ] = await Promise.all([
      baseQuery
        .clone()
        .select('COUNT(scan.id)', 'totalScans')
        .addSelect(`COALESCE(SUM(${completedExpr}), 0)`, 'completedScans')
        .addSelect(`COALESCE(SUM(${pendingExpr}), 0)`, 'pendingScans')
        .addSelect(`COALESCE(SUM(${cancelledExpr}), 0)`, 'cancelledScans')
        .addSelect(
          `COALESCE(SUM(CASE WHEN scan.status = :confirmedStatus THEN 1 ELSE 0 END), 0)`,
          'confirmedScans',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN scan.status = :unconfirmedStatus THEN 1 ELSE 0 END), 0)`,
          'unconfirmedScans',
        )
        .addSelect(
          'COALESCE(SUM(CASE WHEN scan."assignedToId" IS NOT NULL THEN 1 ELSE 0 END), 0)',
          'assignedScans',
        )
        .addSelect(
          'COALESCE(SUM(CASE WHEN scan."assignedToId" IS NULL THEN 1 ELSE 0 END), 0)',
          'unassignedScans',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN scan."assignedToId" IS NULL AND scan."isScanned" = false AND scan.status != :cancelledStatus THEN 1 ELSE 0 END), 0)`,
          'unassignedPendingScans',
        )
        .setParameters(params)
        .getRawOne<StatsOverviewRow>(),
      this.usersRepository.count(),
      this.doctorsRepository.count(),
      this.clinicsRepository.count(),
      this.usersRepository.countBy({ role: UserRole.Administrator }),
      this.usersRepository.countBy({ role: UserRole.Scanner }),
      baseQuery
        .clone()
        .select('doctor.id', 'id')
        .addSelect('doctor.name', 'name')
        .addSelect('clinic.id', 'clinicId')
        .addSelect('clinic.name', 'clinicName')
        .addSelect('COUNT(scan.id)', 'totalScans')
        .addSelect(`COALESCE(SUM(${completedExpr}), 0)`, 'completedScans')
        .addSelect(`COALESCE(SUM(${pendingExpr}), 0)`, 'pendingScans')
        .addSelect(`COALESCE(SUM(${cancelledExpr}), 0)`, 'cancelledScans')
        .groupBy('doctor.id')
        .addGroupBy('doctor.name')
        .addGroupBy('clinic.id')
        .addGroupBy('clinic.name')
        .orderBy(`COALESCE(SUM(${completedExpr}), 0)`, 'DESC')
        .addOrderBy('COUNT(scan.id)', 'DESC')
        .addOrderBy('doctor.name', 'ASC')
        .setParameters(params)
        .limit(5)
        .getRawMany<StatsRankingRow>(),
      baseQuery
        .clone()
        .select('doctor.id', 'id')
        .addSelect('doctor.name', 'name')
        .addSelect('clinic.id', 'clinicId')
        .addSelect('clinic.name', 'clinicName')
        .addSelect('COUNT(scan.id)', 'totalScans')
        .addSelect(`COALESCE(SUM(${completedExpr}), 0)`, 'completedScans')
        .addSelect(`COALESCE(SUM(${pendingExpr}), 0)`, 'pendingScans')
        .addSelect(`COALESCE(SUM(${cancelledExpr}), 0)`, 'cancelledScans')
        .groupBy('doctor.id')
        .addGroupBy('doctor.name')
        .addGroupBy('clinic.id')
        .addGroupBy('clinic.name')
        .orderBy(`COALESCE(SUM(${cancelledExpr}), 0)`, 'DESC')
        .addOrderBy('COUNT(scan.id)', 'DESC')
        .addOrderBy('doctor.name', 'ASC')
        .setParameters(params)
        .limit(5)
        .getRawMany<StatsRankingRow>(),
      baseQuery
        .clone()
        .select('clinic.id', 'id')
        .addSelect('clinic.name', 'name')
        .addSelect('COUNT(scan.id)', 'totalScans')
        .addSelect(`COALESCE(SUM(${completedExpr}), 0)`, 'completedScans')
        .addSelect(`COALESCE(SUM(${pendingExpr}), 0)`, 'pendingScans')
        .addSelect(`COALESCE(SUM(${cancelledExpr}), 0)`, 'cancelledScans')
        .groupBy('clinic.id')
        .addGroupBy('clinic.name')
        .orderBy(`COALESCE(SUM(${completedExpr}), 0)`, 'DESC')
        .addOrderBy('COUNT(scan.id)', 'DESC')
        .addOrderBy('clinic.name', 'ASC')
        .setParameters(params)
        .limit(5)
        .getRawMany<StatsRankingRow>(),
      baseQuery
        .clone()
        .select('createdBy.id', 'id')
        .addSelect('createdBy.username', 'name')
        .addSelect('createdBy.role', 'role')
        .addSelect('COUNT(scan.id)', 'totalScans')
        .addSelect(`COALESCE(SUM(${completedExpr}), 0)`, 'completedScans')
        .addSelect(`COALESCE(SUM(${pendingExpr}), 0)`, 'pendingScans')
        .addSelect(`COALESCE(SUM(${cancelledExpr}), 0)`, 'cancelledScans')
        .andWhere('createdBy.role = :adminRole', { adminRole: UserRole.Administrator })
        .groupBy('createdBy.id')
        .addGroupBy('createdBy.username')
        .addGroupBy('createdBy.role')
        .orderBy('COUNT(scan.id)', 'DESC')
        .addOrderBy(`COALESCE(SUM(${completedExpr}), 0)`, 'DESC')
        .addOrderBy('createdBy.username', 'ASC')
        .setParameters(params)
        .limit(5)
        .getRawMany<StatsRankingRow>(),
      baseQuery
        .clone()
        .select('assignedTo.id', 'id')
        .addSelect('assignedTo.username', 'name')
        .addSelect('assignedTo.role', 'role')
        .addSelect('COUNT(scan.id)', 'totalScans')
        .addSelect(`COALESCE(SUM(${completedExpr}), 0)`, 'completedScans')
        .addSelect(`COALESCE(SUM(${pendingExpr}), 0)`, 'pendingScans')
        .addSelect(`COALESCE(SUM(${cancelledExpr}), 0)`, 'cancelledScans')
        .andWhere('assignedTo.role = :scannerRole', { scannerRole: UserRole.Scanner })
        .groupBy('assignedTo.id')
        .addGroupBy('assignedTo.username')
        .addGroupBy('assignedTo.role')
        .orderBy(`COALESCE(SUM(${completedExpr}), 0)`, 'DESC')
        .addOrderBy('COUNT(scan.id)', 'DESC')
        .addOrderBy('assignedTo.username', 'ASC')
        .setParameters(params)
        .limit(5)
        .getRawMany<StatsRankingRow>(),
    ]);

    const overview = {
      totalScans: this.toNumber(overviewRaw?.totalScans),
      completedScans: this.toNumber(overviewRaw?.completedScans),
      pendingScans: this.toNumber(overviewRaw?.pendingScans),
      cancelledScans: this.toNumber(overviewRaw?.cancelledScans),
      confirmedScans: this.toNumber(overviewRaw?.confirmedScans),
      unconfirmedScans: this.toNumber(overviewRaw?.unconfirmedScans),
      assignedScans: this.toNumber(overviewRaw?.assignedScans),
      unassignedScans: this.toNumber(overviewRaw?.unassignedScans),
      unassignedPendingScans: this.toNumber(overviewRaw?.unassignedPendingScans),
    };

    const doctorsByCompleted = doctorRows.map((row) => this.mapRankingRow(row));
    const doctorsByCancelled = doctorCancelledRows.map((row) => this.mapRankingRow(row));
    const clinicsByCompleted = clinicRows.map((row) => this.mapRankingRow(row));
    const adminsByCreated = adminRows.map((row) => this.mapRankingRow(row));
    const scannersByCompleted = scannerRows.map((row) => this.mapRankingRow(row));

    return {
      generatedAt: new Date().toISOString(),
      timezone: 'America/Chihuahua',
      filters: {
        period: normalizedFilters.period ?? null,
        startDate: normalizedFilters.startDate ?? null,
        endDate: normalizedFilters.endDate ?? null,
        clinicId: normalizedFilters.clinicId ?? null,
        doctorId: normalizedFilters.doctorId ?? null,
        createdById: normalizedFilters.createdById ?? null,
        assignedToId: normalizedFilters.assignedToId ?? null,
        resolvedRange: dateRange,
      },
      overview: {
        ...overview,
        completionRate: this.calculateRate(overview.completedScans, overview.totalScans),
        cancellationRate: this.calculateRate(overview.cancelledScans, overview.totalScans),
        assignmentRate: this.calculateRate(overview.assignedScans, overview.totalScans),
        confirmationRate: this.calculateRate(
          overview.confirmedScans,
          overview.totalScans - overview.cancelledScans,
        ),
      },
      catalog: {
        totalUsers,
        totalAdmins,
        totalScanners,
        totalDoctors,
        totalClinics,
        averageScansPerDoctor: this.calculateAverage(overview.totalScans, totalDoctors),
        averageScansPerClinic: this.calculateAverage(overview.totalScans, totalClinics),
      },
      leaders: {
        topDoctorByCompleted: doctorsByCompleted.find((item) => item.completedScans > 0) ?? null,
        topDoctorByCancelled: doctorsByCancelled.find((item) => item.cancelledScans > 0) ?? null,
        topClinicByCompleted: clinicsByCompleted.find((item) => item.completedScans > 0) ?? null,
        topAdminByCreated: adminsByCreated.find((item) => item.totalScans > 0) ?? null,
        topScannerByCompleted:
          scannersByCompleted.find((item) => item.completedScans > 0) ?? null,
      },
      rankings: {
        doctorsByCompleted,
        doctorsByCancelled,
        clinicsByCompleted,
        adminsByCreated,
        scannersByCompleted,
      },
    };
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

  private mapRankingRow(row: StatsRankingRow) {
    const totalScans = this.toNumber(row.totalScans);
    const completedScans = this.toNumber(row.completedScans);
    const pendingScans = this.toNumber(row.pendingScans);
    const cancelledScans = this.toNumber(row.cancelledScans);

    return {
      id: this.toNumber(row.id),
      name: row.name,
      ...(row.role ? { role: row.role } : {}),
      ...(row.clinicId ? { clinicId: this.toNumber(row.clinicId) } : {}),
      ...(row.clinicName ? { clinicName: row.clinicName } : {}),
      totalScans,
      completedScans,
      pendingScans,
      cancelledScans,
      completionRate: this.calculateRate(completedScans, totalScans),
    };
  }

  private toNumber(value?: string | number | null): number {
    if (value === null || value === undefined) {
      return 0;
    }

    return Number(value);
  }

  private calculateRate(value: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return Number(((value / total) * 100).toFixed(2));
  }

  private calculateAverage(value: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return Number((value / total).toFixed(2));
  }

  private buildStatsBaseQuery(
    filters: StatsFilters,
    params: Record<string, string>,
    dateRange: StatsDateRange | null,
  ): SelectQueryBuilder<Scan> {
    const query = this.repo
      .createQueryBuilder('scan')
      .leftJoin('scan.requestedByDoctor', 'doctor')
      .leftJoin('doctor.clinic', 'clinic')
      .leftJoin('scan.createdBy', 'createdBy')
      .leftJoin('scan.assignedTo', 'assignedTo')
      .setParameters(params);

    if (dateRange) {
      query.andWhere('scan."dateTime"::timestamptz >= :statsStart', {
        statsStart: dateRange.start,
      });
      query.andWhere('scan."dateTime"::timestamptz < :statsEnd', {
        statsEnd: dateRange.end,
      });
    }

    if (filters.clinicId) {
      query.andWhere('clinic.id = :clinicId', { clinicId: filters.clinicId });
    }

    if (filters.doctorId) {
      query.andWhere('doctor.id = :doctorId', { doctorId: filters.doctorId });
    }

    if (filters.createdById) {
      query.andWhere('createdBy.id = :createdById', { createdById: filters.createdById });
    }

    if (filters.assignedToId) {
      query.andWhere('assignedTo.id = :assignedToId', { assignedToId: filters.assignedToId });
    }

    return query;
  }

  private resolveStatsDateRange(filters: StatsFilters): StatsDateRange | null {
    const { period, startDate, endDate } = filters;

    if (period && (startDate || endDate)) {
      throw new BadRequestException(
        'Use either period or startDate/endDate, not both at the same time.',
      );
    }

    if (!period && !startDate && !endDate) {
      return null;
    }

    if (period) {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);

      if (period === 'today') {
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return this.toDateRange(start, end);
      }

      if (period === 'week') {
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return this.toDateRange(start, end);
      }

      if (period === 'month') {
        start.setDate(1);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        return this.toDateRange(start, end);
      }

      throw new BadRequestException('Invalid period. Use today, week or month.');
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required together.');
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }

    if (end < start) {
      throw new BadRequestException('endDate must be greater than or equal to startDate.');
    }

    end.setDate(end.getDate() + 1);
    return this.toDateRange(start, end);
  }

  private toDateRange(start: Date, end: Date): StatsDateRange {
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  private normalizeStatsFilters(filters: StatsFilters): StatsFilters {
    return {
      period: filters.period?.trim().toLowerCase(),
      startDate: filters.startDate?.trim(),
      endDate: filters.endDate?.trim(),
      clinicId: this.normalizePositiveInteger(filters.clinicId, 'clinicId'),
      doctorId: this.normalizePositiveInteger(filters.doctorId, 'doctorId'),
      createdById: this.normalizePositiveInteger(filters.createdById, 'createdById'),
      assignedToId: this.normalizePositiveInteger(filters.assignedToId, 'assignedToId'),
    };
  }

  private normalizePositiveInteger(value: number | undefined, fieldName: string): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer.`);
    }

    return value;
  }
}
