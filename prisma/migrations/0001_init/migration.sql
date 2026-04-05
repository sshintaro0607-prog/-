-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER');
CREATE TYPE "Subject" AS ENUM ('JAPANESE', 'MATH', 'ENGLISH', 'SCIENCE', 'SOCIAL', 'OTHER');
CREATE TYPE "ReportType" AS ENUM ('STUDENT', 'OVERALL');

-- CreateTable: users
CREATE TABLE "users" (
  "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
  "name"          VARCHAR(100)  NOT NULL,
  "birth_date"    DATE,
  "role"          "Role"        NOT NULL,
  "password_hash" VARCHAR(255),
  "is_active"     BOOLEAN       NOT NULL DEFAULT true,
  "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: students
CREATE TABLE "students" (
  "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
  "student_number" VARCHAR(20)   NOT NULL,
  "name"           VARCHAR(100)  NOT NULL,
  "name_kana"      VARCHAR(100)  NOT NULL,
  "grade"          VARCHAR(20)   NOT NULL,
  "is_active"      BOOLEAN       NOT NULL DEFAULT true,
  "created_at"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "students_student_number_key" UNIQUE ("student_number")
);

-- CreateTable: student_standing_notes
CREATE TABLE "student_standing_notes" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID        NOT NULL,
  "content"    TEXT        NOT NULL,
  "sort_order" INTEGER     NOT NULL DEFAULT 0,
  "updated_by" UUID        NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "student_standing_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: handover_records
CREATE TABLE "handover_records" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "student_id"      UUID        NOT NULL,
  "author_id"       UUID        NOT NULL,
  "subject"         "Subject"   NOT NULL,
  "lesson_date"     DATE        NOT NULL,
  "todays_content"  TEXT,
  "achieved"        TEXT,
  "not_achieved"    TEXT,
  "improvement"     TEXT,
  "special_notes"   TEXT,
  "last_updated_by" UUID,
  "is_deleted"      BOOLEAN     NOT NULL DEFAULT false,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "handover_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: attachments
CREATE TABLE "attachments" (
  "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
  "handover_id"   UUID         NOT NULL,
  "uploaded_by"   UUID         NOT NULL,
  "original_name" VARCHAR(255) NOT NULL,
  "stored_name"   VARCHAR(255) NOT NULL,
  "storage_path"  TEXT         NOT NULL,
  "mime_type"     VARCHAR(100) NOT NULL,
  "file_size"     BIGINT       NOT NULL,
  "is_deleted"    BOOLEAN      NOT NULL DEFAULT false,
  "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "attachments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attachments_stored_name_key" UNIQUE ("stored_name")
);

-- CreateTable: ai_reports
CREATE TABLE "ai_reports" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "student_id"   UUID,
  "report_type"  "ReportType" NOT NULL,
  "target_year"  SMALLINT    NOT NULL,
  "target_month" SMALLINT    NOT NULL,
  "content"      TEXT        NOT NULL,
  "generated_by" UUID,
  "model_used"   VARCHAR(100) NOT NULL,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_reports_student_id_target_year_target_month_key"
    UNIQUE ("student_id", "target_year", "target_month")
);

-- CreateTable: system_settings
CREATE TABLE "system_settings" (
  "key"        VARCHAR(100) NOT NULL,
  "value"      TEXT         NOT NULL,
  "updated_by" UUID,
  "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- Indexes
CREATE INDEX "idx_handover_student_id"  ON "handover_records"("student_id");
CREATE INDEX "idx_handover_lesson_date" ON "handover_records"("lesson_date" DESC);
CREATE INDEX "idx_handover_subject"     ON "handover_records"("subject");

-- Foreign Keys
ALTER TABLE "student_standing_notes"
  ADD CONSTRAINT "student_standing_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "student_standing_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");

ALTER TABLE "handover_records"
  ADD CONSTRAINT "handover_records_student_id_fkey"      FOREIGN KEY ("student_id")      REFERENCES "students"("id"),
  ADD CONSTRAINT "handover_records_author_id_fkey"       FOREIGN KEY ("author_id")       REFERENCES "users"("id"),
  ADD CONSTRAINT "handover_records_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "users"("id");

ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_handover_id_fkey" FOREIGN KEY ("handover_id") REFERENCES "handover_records"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by")  REFERENCES "users"("id");

ALTER TABLE "ai_reports"
  ADD CONSTRAINT "ai_reports_student_id_fkey"   FOREIGN KEY ("student_id")   REFERENCES "students"("id"),
  ADD CONSTRAINT "ai_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id");

ALTER TABLE "system_settings"
  ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
