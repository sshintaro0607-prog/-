-- AlterTable
ALTER TABLE "handover_records" ADD COLUMN     "check_test_result" TEXT,
ADD COLUMN     "is_draft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "next_check_test" TEXT,
ADD COLUMN     "next_plan" TEXT;
