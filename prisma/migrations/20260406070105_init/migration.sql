-- DropForeignKey
ALTER TABLE "ai_reports" DROP CONSTRAINT "ai_reports_generated_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_reports" DROP CONSTRAINT "ai_reports_student_id_fkey";

-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_handover_id_fkey";

-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "handover_records" DROP CONSTRAINT "handover_records_author_id_fkey";

-- DropForeignKey
ALTER TABLE "handover_records" DROP CONSTRAINT "handover_records_last_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "handover_records" DROP CONSTRAINT "handover_records_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_standing_notes" DROP CONSTRAINT "student_standing_notes_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_standing_notes" DROP CONSTRAINT "student_standing_notes_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "system_settings" DROP CONSTRAINT "system_settings_updated_by_fkey";

-- AlterTable
ALTER TABLE "handover_records" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "student_standing_notes" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "system_settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "student_standing_notes" ADD CONSTRAINT "student_standing_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_standing_notes" ADD CONSTRAINT "student_standing_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_records" ADD CONSTRAINT "handover_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_records" ADD CONSTRAINT "handover_records_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_records" ADD CONSTRAINT "handover_records_last_updated_by_fkey" FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_handover_id_fkey" FOREIGN KEY ("handover_id") REFERENCES "handover_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
