import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

const MAX_ROWS = 1000;
const STATUSES = ['ADMITTED', 'ACTIVE', 'ON_BREAK', 'TRANSFERRED_OUT', 'WITHDRAWN', 'CANCELLED', 'COMPLETED'];
const SEATS = ['REGULAR', 'SUPERNUMERARY', 'LATERAL_ENTRY'];

/** A problem with one row that the person can fix. The message is shown to them as written. */
class RowError extends Error {}
/** Thrown on purpose to undo a dry run. */
class Rollback extends Error {}

interface Normalised {
  apaarId: string | null;
  fullName: string;
  dateOfBirth: Date;
  programmeId?: string;
  programme?: string;
  academicYear?: number;
  shift: number;
  status: string;
  seatType: string;
  startDate: Date;
  endDate: Date | null;
  isNri: boolean;
  isOci: boolean;
  isForeignNational: boolean;
}

export interface RowResult {
  row: number;
  ok: boolean;
  error?: string;
  enrolmentId?: string;
  newStudent?: boolean;
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());
const sameName = (a: string, b: string) =>
  a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();
const day = (d: Date) => d.toISOString().slice(0, 10);

/** Accepts YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY. */
function parseDate(value: unknown, label: string): Date {
  const s = text(value);
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (match) {
    [y, m, d] = [+match[1], +match[2], +match[3]];
  } else if ((match = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(s))) {
    [d, m, y] = [+match[1], +match[2], +match[3]];
  } else {
    throw new RowError(`${label} must be a date like 2026-08-01 or 01/08/2026`);
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw new RowError(`${label} is not a real date`);
  }
  return date;
}

function parseBool(value: unknown, label: string): boolean {
  const s = text(value);
  if (s === '' || /^(false|no|n|0)$/i.test(s)) return false;
  if (/^(true|yes|y|1)$/i.test(s)) return true;
  throw new RowError(`${label} must be yes or no`);
}

function normalise(raw: any): Normalised {
  if (!raw || typeof raw !== 'object') throw new RowError('Row is empty');

  const fullName = text(raw.fullName);
  if (!fullName) throw new RowError('Name is required');
  if (fullName.length > 200) throw new RowError('Name is too long');

  const dateOfBirth = parseDate(raw.dateOfBirth, 'Date of birth');
  const today = new Date();
  if (dateOfBirth > today) throw new RowError('Date of birth is in the future');
  if (today.getUTCFullYear() - dateOfBirth.getUTCFullYear() > 100) {
    throw new RowError('Date of birth is more than 100 years ago');
  }

  const isForeignNational = parseBool(raw.isForeignNational, 'Foreign national');
  const apaarRaw = text(raw.apaarId);
  if (apaarRaw && !/^\d{12}$/.test(apaarRaw)) throw new RowError('APAAR ID must be 12 digits');
  if (!apaarRaw && !isForeignNational) {
    throw new RowError('APAAR ID is required unless the student is a foreign national');
  }

  const status = text(raw.status).toUpperCase() || 'ACTIVE';
  if (!STATUSES.includes(status)) throw new RowError(`Status must be one of ${STATUSES.join(', ')}`);

  const seatType = text(raw.seatType).toUpperCase() || 'REGULAR';
  if (!SEATS.includes(seatType)) throw new RowError(`Seat type must be one of ${SEATS.join(', ')}`);

  const startDate = parseDate(raw.startDate, 'Start date');
  const endDate = text(raw.endDate) ? parseDate(raw.endDate, 'End date') : null;
  if (endDate && endDate <= startDate) throw new RowError('End date must be after the start date');

  const programmeId = text(raw.programmeId) || undefined;
  const programme = text(raw.programme) || undefined;
  let academicYear: number | undefined;
  if (!programmeId) {
    if (!programme) throw new RowError('Programme is required');
    academicYear = Number(text(raw.academicYear));
    if (!Number.isInteger(academicYear) || academicYear < 1990 || academicYear > 2100) {
      throw new RowError('Academic year must be a year like 2026');
    }
  }
  const shift = text(raw.shift) ? Number(text(raw.shift)) : 1;
  if (!Number.isInteger(shift) || shift < 1 || shift > 5) throw new RowError('Shift must be a number from 1 to 5');

  return {
    apaarId: apaarRaw || null,
    fullName,
    dateOfBirth,
    programmeId,
    programme,
    academicYear,
    shift,
    status,
    seatType,
    startDate,
    endDate,
    isNri: parseBool(raw.isNri, 'NRI'),
    isOci: parseBool(raw.isOci, 'OCI'),
    isForeignNational,
  };
}

function isOverlapError(e: any): boolean {
  return (
    e?.code === '23P01' ||
    e?.meta?.code === '23P01' ||
    e?.cause?.code === '23P01' ||
    /exclusion constraint|conflicting key value/i.test(String(e?.message ?? ''))
  );
}

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);

  constructor(private prisma: PrismaService) {}

  private institutionOf(user: any): string {
    if (!user?.institutionId) throw new ForbiddenException('User is not associated with an institution');
    return user.institutionId;
  }

  async createOne(raw: any, user: any) {
    const institutionId = this.institutionOf(user);
    const result = await this.processRow(raw, institutionId, false, 1);
    if (!result.ok) throw new BadRequestException(result.error);
    return result;
  }

  async importRows(body: any, user: any) {
    const institutionId = this.institutionOf(user);
    const rows = body?.rows;
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('No rows to import');
    if (rows.length > MAX_ROWS) throw new BadRequestException(`Import at most ${MAX_ROWS} rows at a time`);
    const dryRun = body?.dryRun === true;

    const results: RowResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      results.push(await this.processRow(rows[i], institutionId, dryRun, i + 1));
    }
    const created = results.filter((r) => r.ok).length;
    return { dryRun, total: results.length, ok: created, failed: results.length - created, results };
  }

  /** Runs one row in its own transaction, so one bad row never blocks the others. */
  private async processRow(raw: any, institutionId: string, dryRun: boolean, row: number): Promise<RowResult> {
    try {
      const n = normalise(raw);
      let written: { enrolmentId: string; newStudent: boolean } | undefined;
      try {
        await this.prisma.$transaction(async (tx) => {
          written = await this.write(tx, institutionId, n);
          if (dryRun) throw new Rollback();
        });
      } catch (e) {
        if (!(e instanceof Rollback)) throw e;
      }
      return { row, ok: true, enrolmentId: dryRun ? undefined : written?.enrolmentId, newStudent: written?.newStudent };
    } catch (e: any) {
      if (e instanceof RowError) return { row, ok: false, error: e.message };
      if (isOverlapError(e)) {
        return {
          row,
          ok: false,
          error: 'This student already has a confirmed enrolment for these dates. Change the dates or the status.',
        };
      }
      this.logger.error(`Row ${row} failed unexpectedly`, e?.stack ?? String(e));
      return { row, ok: false, error: 'Unexpected error while saving this row' };
    }
  }

  private async write(tx: Prisma.TransactionClient, institutionId: string, n: Normalised) {
    // 1. Programme must belong to this institution
    const programme = n.programmeId
      ? await tx.programme.findFirst({ where: { id: n.programmeId, institutionId } })
      : await tx.programme.findFirst({
          where: {
            institutionId,
            name: { equals: n.programme!, mode: 'insensitive' },
            academicYear: n.academicYear!,
            shift: n.shift,
          },
        });
    if (!programme) {
      throw new RowError(
        n.programmeId
          ? 'Programme not found for your institution'
          : `No programme named "${n.programme}" for ${n.academicYear}, shift ${n.shift}, at your institution`,
      );
    }

    // 2. Find the student, or create one
    let student = n.apaarId
      ? await tx.student.findUnique({ where: { apaarId: n.apaarId } })
      : await tx.student.findFirst({
          where: {
            apaarId: null,
            fullName: { equals: n.fullName, mode: 'insensitive' },
            dateOfBirth: n.dateOfBirth,
            enrolments: { some: { programme: { institutionId } } },
          },
        });

    let newStudent = false;
    if (student) {
      if (n.apaarId && (!sameName(student.fullName, n.fullName) || day(student.dateOfBirth) !== day(n.dateOfBirth))) {
        throw new RowError(
          'This APAAR ID is already registered with a different name or date of birth. Check all three.',
        );
      }
    } else {
      student = await tx.student.create({
        data: { apaarId: n.apaarId, fullName: n.fullName, dateOfBirth: n.dateOfBirth },
      });
      newStudent = true;
    }

    // 3. Same enrolment twice is a mistake, not new data
    const duplicate = await tx.enrolment.findFirst({
      where: { studentId: student.id, programmeId: programme.id, startDate: n.startDate },
    });
    if (duplicate) throw new RowError('This enrolment is already recorded');

    // 4. The database refuses overlapping confirmed enrolments (see isOverlapError)
    const enrolment = await tx.enrolment.create({
      data: {
        studentId: student.id,
        programmeId: programme.id,
        status: n.status as any,
        seatType: n.seatType as any,
        isNri: n.isNri,
        isOci: n.isOci,
        isForeignNational: n.isForeignNational,
        startDate: n.startDate,
        endDate: n.endDate,
      },
    });
    return { enrolmentId: enrolment.id, newStudent };
  }
}
