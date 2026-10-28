import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import * as argon2 from "argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type EnrolStatus = "ACTIVE" | "ON_BREAK" | "PENDING_REVIEW" | "ADMITTED" | "WITHDRAWN";

// Small helpers so each situation below stays readable
const programme = (institutionId: string, name: string, academicYear: number, approvedIntake: number) =>
  prisma.programme.create({ data: { institutionId, name, academicYear, approvedIntake } });

const student = (apaarId: string | null, fullName: string, dateOfBirth: string) =>
  prisma.student.create({ data: { apaarId, fullName, dateOfBirth: new Date(dateOfBirth) } });

const enrol = (
  studentId: string,
  programmeId: string,
  status: EnrolStatus,
  startDate: string,
  extra: {
    endDate?: Date;
    seatType?: "SUPERNUMERARY" | "LATERAL_ENTRY";
    isForeignNational?: boolean;
    isNri?: boolean;
    isOci?: boolean;
  } = {},
) =>
  prisma.enrolment.create({
    data: { studentId, programmeId, status, startDate: new Date(startDate), ...extra },
  });

// ---- Deterministic random data: the same seed run always gives the same 200 students ----
function makeRng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = makeRng(2026);
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
function pick<T>(arr: readonly T[]): T {
  return arr[int(0, arr.length - 1)];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const addDays = (base: string, n: number) => {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const FIRST = ["Aarav", "Vihaan", "Aditya", "Arjun", "Ishaan", "Kabir", "Rohan", "Sai", "Ananya", "Diya", "Isha", "Kavya", "Meera", "Priya", "Saanvi", "Sneha", "Tanvi", "Aisha", "Nikhil", "Pooja"];
const LAST = ["Sharma", "Verma", "Gupta", "Singh", "Patel", "Reddy", "Nair", "Iyer", "Khan", "Das", "Joshi", "Mehta", "Rao", "Kulkarni", "Yadav", "Mishra", "Bose", "Chopra", "Menon", "Pillai"];
const PROGRAMMES = [
  "B.Tech CSE", "B.Tech ECE", "B.Tech Mechanical", "B.Tech Civil", "B.Tech Electrical",
  "MBA", "MCA", "M.Tech CSE", "B.Pharm", "Diploma in Mechanical",
];
const OTHER_STATES = ["Karnataka", "Tamil Nadu", "Gujarat", "Rajasthan", "Delhi", "West Bengal", "Telangana", "Madhya Pradesh"];

// Programmes students can be placed in, with seat tracking so we never exceed approved intake by accident
type Pool = { id: string; year: number; intake: number; lateralIntake: number; used: number; lateral: number };
const pool: Pool[] = [];

async function addPoolProgramme(institutionId: string, name: string, year: number) {
  const intake = pick([8, 10, 12, 15, 20, 25]);
  const lateralIntake = name.startsWith("B.Tech") || name.startsWith("Diploma") ? pick([0, 3, 4, 5]) : 0;
  const p = await prisma.programme.create({
    data: { institutionId, name, academicYear: year, approvedIntake: intake, lateralIntake },
  });
  pool.push({ id: p.id, year, intake, lateralIntake, used: 0, lateral: 0 });
}

function takeSeat(opts: { lateral?: boolean; year?: number } = {}): Pool | null {
  const candidates = pool.filter(
    (p) =>
      (opts.year === undefined || p.year === opts.year) &&
      (opts.lateral ? p.lateral < p.lateralIntake : p.used < p.intake),
  );
  if (candidates.length === 0) return null;
  const p = pick(candidates);
  if (opts.lateral) p.lateral++;
  else p.used++;
  return p;
}

const startFor = (year: number) => addDays(year === 2025 ? "2025-07-25" : "2026-07-25", int(0, year === 2025 ? 45 : 50));
const dobString = () =>
  `${int(2002, 2008)}-${String(int(1, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`;
const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database");
  }

  // Clear old data first, children before parents, so the script can be re-run
  await prisma.case.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.enrolment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.institution.deleteMany();

  // ---- Institutes A to J ----
  const instA = await prisma.institution.create({
    data: { aicteCode: "TEST-INST-001", name: "Institute - A", state: "Uttar Pradesh" },
  });
  const instB = await prisma.institution.create({
    data: { aicteCode: "TEST-INST-002", name: "Institute - B", state: "Maharashtra" },
  });
  const others: { id: string }[] = [];
  for (const [i, state] of OTHER_STATES.entries()) {
    const letter = String.fromCharCode("C".charCodeAt(0) + i); // C..J
    others.push(
      await prisma.institution.create({
        data: {
          aicteCode: `TEST-INST-${String(i + 3).padStart(3, "0")}`,
          name: `Institute - ${letter}`,
          state,
        },
      }),
    );
  }

  // Test users
  const passwordHash = await argon2.hash("Password123!");
  await prisma.user.create({
    data: {
      email: "aicte.admin@apaar.gov.in",
      passwordHash,
      fullName: "AICTE Admin",
      role: "AICTE_ADMIN",
      institutionId: null,
    },
  });
  await prisma.user.create({
    data: {
      email: "admin@insta.edu.in",
      passwordHash,
      fullName: "InstA Admin",
      role: "INSTITUTION_ADMIN",
      institutionId: instA.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "operator@instb.edu.in",
      passwordHash,
      fullName: "InstB Operator",
      role: "INSTITUTION_OPERATOR",
      institutionId: instB.id,
    },
  });

  // Programmes used by the hand-made situations below (kept exactly as before)
  const aCse2025 = await programme(instA.id, "B.Tech CSE", 2025, 60);
  const aCse2026 = await programme(instA.id, "B.Tech CSE", 2026, 60);
  const bCse2026 = await programme(instB.id, "B.Tech CSE", 2026, 60);
  const bEce2026 = await programme(instB.id, "B.Tech ECE", 2026, 2); // tiny intake on purpose

  // Extra programmes: A and B get one more each, C to J get 2 to 4 each
  await addPoolProgramme(instA.id, "MBA", 2026);
  await addPoolProgramme(instB.id, "MCA", 2025);
  for (const inst of others) {
    const combos = shuffle(PROGRAMMES.flatMap((n) => [2025, 2026].map((y) => [n, y] as const)));
    for (const [name, year] of combos.slice(0, int(2, 4))) {
      await addPoolProgramme(inst.id, name, year);
    }
  }

  // Situation 1: a legitimate move. Riya leaves A on 12 Jan and joins B the same day.
  const riya = await student("100000000001", "Riya Test", "2006-05-14");
  await enrol(riya.id, aCse2025.id, "WITHDRAWN", "2025-08-01", { endDate: new Date("2026-01-12") });
  await enrol(riya.id, bCse2026.id, "ACTIVE", "2026-01-12");

  // Demo portal users
  await prisma.user.create({
    data: {
      email: "riya.student@example.com",
      passwordHash,
      fullName: "Riya Test",
      role: "STUDENT",
      institutionId: null,
      studentId: riya.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "verifier@example.com",
      passwordHash,
      fullName: "Demo Verifier",
      role: "VERIFIER",
      institutionId: null,
    },
  });

  // Situation 2: over intake. B's ECE programme has 2 seats but 3 active students.
  for (const [i, name] of ["Aman", "Neha", "Karan"].entries()) {
    const s = await student(`10000000000${i + 2}`, `${name} Test`, "2006-02-01");
    await enrol(s.id, bEce2026.id, "ACTIVE", "2026-08-01");
  }

  // Situation 3: a foreign national with no APAAR ID, on a supernumerary seat.
  const fn = await student(null, "Foreign Student Test", "2005-09-09");
  await enrol(fn.id, aCse2026.id, "ACTIVE", "2026-08-01", { seatType: "SUPERNUMERARY", isForeignNational: true });

  // Situation 4: possible duplicate. Active at A with no end date, and B reports the same student.
  const dev = await student("100000000005", "Dev Test", "2006-03-03");
  await enrol(dev.id, aCse2026.id, "ACTIVE", "2026-08-01");
  const devPending = await enrol(dev.id, bCse2026.id, "PENDING_REVIEW", "2026-08-10");
  await prisma.case.create({
    data: {
      type: "OVERLAP",
      studentId: dev.id,
      enrolmentId: devPending.id,
      institutionId: instB.id,
      description:
        "Dev Test is already ACTIVE at Institute - A with no end date, and Institute - B reports the same student from 10 Aug 2026.",
    },
  });

  // ---- Bulk demo students: 194 generated + 6 above = 200 in total ----
  const GENERATED = 194;
  let seq = 0;
  const nextApaar = () => String(200000000001 + seq++);

  // Situation 5: more over-intake programmes. B ECE above is the 1st, these 6 make 7 in total.
  // Each gets a small approved intake and 1 or 2 more active students than seats.
  let overCount = 0;
  for (const p of shuffle(pool).slice(0, 6)) {
    const intake = pick([3, 4, 5, 6]);
    await prisma.programme.update({ where: { id: p.id }, data: { approvedIntake: intake } });
    const students = intake + int(1, 2);
    for (let k = 0; k < students; k++) {
      const s = await student(nextApaar(), fullName(), dobString());
      await enrol(s.id, p.id, "ACTIVE", startFor(p.year));
      overCount++;
    }
    // Mark as full so the random assignment below never adds to it
    p.intake = intake;
    p.used = students;
    p.lateral = p.lateralIntake;
  }

  for (let n = 0; n < GENERATED - overCount; n++) {
    const apaarId = nextApaar();

    // 10 students who moved between institutes (old enrolment ended, new one starts the same day)
    if (n < 10) {
      const s = await student(apaarId, fullName(), dobString());
      const from = pick(pool.filter((p) => p.year === 2025));
      const to = takeSeat({ year: 2026 });
      const moveDay = `2026-07-${20 + int(0, 9)}`;
      const fromStart = startFor(2025);
      await enrol(s.id, from.id, "WITHDRAWN", fromStart, { endDate: new Date(moveDay) });
      if (to) await enrol(s.id, to.id, "ACTIVE", moveDay);
      continue;
    }

    // 2 more foreign nationals without an APAAR ID, on supernumerary seats
    if (n < 12) {
      const s = await student(null, `${fullName()} (Foreign)`, dobString());
      const p = pick(pool.filter((x) => x.year === 2026));
      await enrol(s.id, p.id, "ACTIVE", startFor(2026), { seatType: "SUPERNUMERARY", isForeignNational: true });
      continue;
    }

    const s = await student(apaarId, fullName(), dobString());
    const r = rand();
    let status: EnrolStatus =
      r < 0.78 ? "ACTIVE" : r < 0.83 ? "ON_BREAK" : r < 0.9 ? "PENDING_REVIEW" : r < 0.94 ? "ADMITTED" : "WITHDRAWN";

    let target: Pool | null = null;
    let seatType: "SUPERNUMERARY" | "LATERAL_ENTRY" | undefined;

    if (status === "ACTIVE" && rand() < 0.04) {
      target = pick(pool); // supernumerary seats sit outside the approved intake
      seatType = "SUPERNUMERARY";
    } else if (status === "ACTIVE" && rand() < 0.1) {
      target = takeSeat({ lateral: true });
      if (target) seatType = "LATERAL_ENTRY";
    }
    if (!target && status !== "WITHDRAWN") target = takeSeat();
    if (!target) {
      // withdrawn, or no seat left: record as withdrawn so intake is never exceeded by accident
      status = "WITHDRAWN";
      target = pick(pool);
    }

    const start = startFor(target.year);
    const extra: Parameters<typeof enrol>[4] = {};
    if (seatType) extra.seatType = seatType;
    if (status === "ACTIVE" && !seatType) {
      const f = rand();
      if (f < 0.05) extra.isNri = true;
      else if (f < 0.08) extra.isOci = true;
    }
    if (status === "WITHDRAWN") {
      const end = addDays(start, int(20, 200));
      extra.endDate = new Date(end < "2026-10-25" ? end : "2026-10-25");
    }
    await enrol(s.id, target.id, status, start, extra);
  }

  const [inst, prog, stu, enr] = await Promise.all([
    prisma.institution.count(),
    prisma.programme.count(),
    prisma.student.count(),
    prisma.enrolment.count(),
  ]);
  console.log(`Seed complete: ${inst} institutions, ${prog} programmes, ${stu} students, ${enr} enrolments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());