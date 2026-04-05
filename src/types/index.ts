import type { Role, Subject, ReportType } from "@prisma/client";

export type { Role, Subject, ReportType };

export const GRADES = [
  "小1", "小2", "小3", "小4", "小5", "小6",
  "中1", "中2", "中3",
  "高1", "高2", "高3",
] as const;

export type Grade = (typeof GRADES)[number];

export const SUBJECT_LABELS: Record<Subject, string> = {
  JAPANESE: "国語",
  MATH: "数学",
  ENGLISH: "英語",
  SCIENCE: "理科",
  SOCIAL: "社会",
  OTHER: "その他",
};

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
};
