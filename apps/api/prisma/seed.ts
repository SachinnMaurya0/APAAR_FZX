import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Small helpers so each situation below stays readable
const programme = (institutionId: string, name: string, academicYear: number, approvedIntake: number) =>
  prisma.programme.create({ data: { institutionId, name, academicYear, approvedIntake } });

const student = (apaarId: string | null, fullName: string, dateOfBirth: string) =>
  prisma.student.create({ data: { apaarId, fullName, dateOfBirth: new Date(dateOfBirth) } });

const enrol = (
  studentId: string,
  programmeId: string,
  status: "ACTIVE" | "WITHDRAWN" | "PENDING_REVIEW",
  startDate: string,
  extra: { endDate?: Date; seatType?: "SUPERNUMERARY"; isForeignNational?: boolean } = {},
) =>
  prisma.enrolment.create({
    data: { studentId, programmeId, status, startDate: new Date(startDate), ...extra },
  });

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database");
  }

  // Clear old data first, children before parents, so the script can be re-run
  await prisma.enrolment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.institution.deleteMany();

  const instA = await prisma.institution.create({
    data: { aicteCode: "TEST-INST-001", name: "Test Institute of Technology", state: "Uttar Pradesh" },
  });
  const instB = await prisma.institution.create({
    data: { aicteCode: "TEST-INST-002", name: "Demo College of Engineering", state: "Maharashtra" },
  });

  const aCse2025 = await programme(instA.id, "B.Tech CSE", 2025, 60);
  const aCse2026 = await programme(instA.id, "B.Tech CSE", 2026, 60);
  const bCse2026 = await programme(instB.id, "B.Tech CSE", 2026, 60);
  const bEce2026 = await programme(instB.id, "B.Tech ECE", 2026, 2); // tiny intake on purpose

  // Situation 1: a legitimate move. Riya leaves A on 12 Jan and joins B the same day.
  const riya = await student("100000000001", "Riya Test", "2006-05-14");
  await enrol(riya.id, aCse2025.id, "WITHDRAWN", "2025-08-01", { endDate: new Date("2026-01-12") });
  await enrol(riya.id, bCse2026.id, "ACTIVE", "2026-01-12");

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
  await enrol(dev.id, bCse2026.id, "PENDING_REVIEW", "2026-08-10");

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());