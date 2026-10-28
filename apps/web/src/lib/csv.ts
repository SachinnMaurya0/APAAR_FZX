// Small CSV reader: handles quotes, commas and line breaks inside quotes, and a leading BOM.
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export interface ImportRow {
  apaarId?: string;
  fullName?: string;
  dateOfBirth?: string;
  programme?: string;
  academicYear?: string;
  shift?: string;
  status?: string;
  seatType?: string;
  startDate?: string;
  endDate?: string;
  isNri?: string;
  isOci?: string;
  isForeignNational?: string;
}

const aliases: Record<string, keyof ImportRow> = {
  apaarid: 'apaarId',
  apaar: 'apaarId',
  fullname: 'fullName',
  name: 'fullName',
  studentname: 'fullName',
  dateofbirth: 'dateOfBirth',
  dob: 'dateOfBirth',
  programme: 'programme',
  program: 'programme',
  programmename: 'programme',
  course: 'programme',
  academicyear: 'academicYear',
  year: 'academicYear',
  batch: 'academicYear',
  shift: 'shift',
  status: 'status',
  seattype: 'seatType',
  seat: 'seatType',
  startdate: 'startDate',
  admissiondate: 'startDate',
  start: 'startDate',
  enddate: 'endDate',
  end: 'endDate',
  isnri: 'isNri',
  nri: 'isNri',
  isoci: 'isOci',
  oci: 'isOci',
  isforeignnational: 'isForeignNational',
  foreignnational: 'isForeignNational',
  foreign: 'isForeignNational',
};

const required: (keyof ImportRow)[] = ['fullName', 'dateOfBirth', 'programme', 'academicYear', 'startDate'];

export interface ParsedImport {
  rows: ImportRow[];
  problem: string | null;
}

export function readImportFile(text: string): ParsedImport {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], problem: 'The file needs a header row and at least one student.' };

  const keys = table[0].map((h) => aliases[h.toLowerCase().replace(/[^a-z0-9]/g, '')]);
  const unknown = table[0].filter((_, i) => !keys[i]);
  const missing = required.filter((k) => !keys.includes(k));
  if (missing.length > 0) {
    return { rows: [], problem: `Missing columns: ${missing.join(', ')}. Download the template to see the expected columns.` };
  }
  if (unknown.length > 0) {
    return { rows: [], problem: `Unrecognised columns: ${unknown.join(', ')}. Download the template to see the expected columns.` };
  }

  const rows = table.slice(1).map((cells) => {
    const r: ImportRow = {};
    keys.forEach((k, i) => {
      if (k) r[k] = (cells[i] ?? '').trim();
    });
    return r;
  });
  return { rows, problem: null };
}

export const templateCsv =
  'apaarId,fullName,dateOfBirth,programme,academicYear,shift,status,seatType,startDate,endDate,isNri,isOci,isForeignNational\n' +
  '100000000101,Sample Student One,2007-04-02,B.Tech CSE,2026,1,ACTIVE,REGULAR,2026-08-01,,no,no,no\n' +
  ',Sample Foreign Student,2006-11-20,B.Tech CSE,2026,1,ACTIVE,SUPERNUMERARY,2026-08-01,,no,no,yes\n';

export function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([templateCsv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
