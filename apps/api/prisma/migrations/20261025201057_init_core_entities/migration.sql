-- CreateEnum
CREATE TYPE "EnrolmentStatus" AS ENUM ('ADMITTED', 'ACTIVE', 'ON_BREAK', 'TRANSFERRED_OUT', 'WITHDRAWN', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('REGULAR', 'SUPERNUMERARY', 'LATERAL_ENTRY');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "aicteCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "shift" INTEGER NOT NULL DEFAULT 1,
    "approvedIntake" INTEGER NOT NULL,
    "lateralIntake" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "apaarId" TEXT,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrolment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "status" "EnrolmentStatus" NOT NULL,
    "seatType" "SeatType" NOT NULL DEFAULT 'REGULAR',
    "isNri" BOOLEAN NOT NULL DEFAULT false,
    "isOci" BOOLEAN NOT NULL DEFAULT false,
    "isForeignNational" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "previousEnrolmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrolment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_aicteCode_key" ON "Institution"("aicteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_institutionId_name_academicYear_shift_key" ON "Programme"("institutionId", "name", "academicYear", "shift");

-- CreateIndex
CREATE UNIQUE INDEX "Student_apaarId_key" ON "Student"("apaarId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrolment_previousEnrolmentId_key" ON "Enrolment"("previousEnrolmentId");

-- CreateIndex
CREATE INDEX "Enrolment_studentId_idx" ON "Enrolment"("studentId");

-- CreateIndex
CREATE INDEX "Enrolment_programmeId_status_idx" ON "Enrolment"("programmeId", "status");

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_previousEnrolmentId_fkey" FOREIGN KEY ("previousEnrolmentId") REFERENCES "Enrolment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
