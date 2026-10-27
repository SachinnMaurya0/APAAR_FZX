CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Enrolment"
  ADD CONSTRAINT enrolment_dates_valid
  CHECK ("endDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "Enrolment"
  ADD CONSTRAINT enrolment_no_overlap_confirmed
  EXCLUDE USING gist (
    "studentId" WITH =,
    daterange("startDate", COALESCE("endDate", 'infinity'::date), '[)') WITH &&
  )
  WHERE (status IN ('ACTIVE', 'ON_BREAK'));