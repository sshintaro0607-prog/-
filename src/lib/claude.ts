import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-5";

type HandoverForReport = {
  lessonDate: Date;
  subject: string;
  todaysContent: string | null;
  achieved: string | null;
  notAchieved: string | null;
  improvement: string | null;
  specialNotes: string | null;
  author: { name: string };
};

function buildStudentPrompt(
  studentName: string,
  year: number,
  month: number,
  handovers: HandoverForReport[]
): string {
  const records = handovers
    .map((h) => {
      const date = h.lessonDate.toLocaleDateString("ja-JP");
      return [
        `【${date} / ${h.subject} / 担当: ${h.author.name}】`,
        h.todaysContent ? `今日の内容: ${h.todaysContent}` : "",
        h.achieved ? `できたこと: ${h.achieved}` : "",
        h.notAchieved ? `できなかったこと: ${h.notAchieved}` : "",
        h.improvement ? `改善策: ${h.improvement}` : "",
        h.specialNotes ? `特記事項: ${h.specialNotes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");

  return `以下は学習塾の生徒「${studentName}」の${year}年${month}月の授業引継書データです。
これを分析して、月次まとめレポートをMarkdown形式で作成してください。

## 引継書データ

${records}

---

## 出力形式

以下の構成でMarkdownレポートを作成してください：

# ${year}年${month}月 学習まとめレポート - ${studentName}

## 1. 学習進捗サマリー
- 当月扱った単元・範囲の概要
- 科目別の進捗状況

## 2. できたこと・できなかったことの傾向
- 繰り返し「できたこと」のパターン（定着している内容）
- 繰り返し「できなかったこと」のパターン（課題）

## 3. 改善策の集約
- 引継書で記録された改善策の共通点・優先事項

## 4. 来月の指導方針案
- 引継書の内容を踏まえた次月の推奨アクション
- 優先して取り組むべき単元・課題

## 5. 授業実施状況
- 授業回数: ${handovers.length}回
- 受講科目の内訳`;
}

export async function generateStudentReport(
  studentId: string,
  year: number,
  month: number
): Promise<string> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

  const handovers = await prisma.handoverRecord.findMany({
    where: {
      studentId,
      isDeleted: false,
      lessonDate: { gte: startDate, lte: endDate },
    },
    orderBy: { lessonDate: "asc" },
    include: { author: { select: { name: true } } },
  });

  if (handovers.length === 0) {
    return `# ${year}年${month}月 学習まとめレポート - ${student.name}\n\n対象期間に授業記録がありませんでした。`;
  }

  const prompt = buildStudentPrompt(student.name, year, month, handovers);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude API");
  return content.text;
}

export async function generateOverallReport(year: number, month: number): Promise<string> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const handovers = await prisma.handoverRecord.findMany({
    where: {
      isDeleted: false,
      lessonDate: { gte: startDate, lte: endDate },
    },
    orderBy: { lessonDate: "asc" },
    include: {
      author: { select: { name: true } },
      student: { select: { name: true, grade: true } },
    },
  });

  if (handovers.length === 0) {
    return `# ${year}年${month}月 塾全体まとめレポート\n\n対象期間に授業記録がありませんでした。`;
  }

  const records = handovers
    .map((h) => {
      const date = h.lessonDate.toLocaleDateString("ja-JP");
      return [
        `【${date} / ${h.student.name}(${h.student.grade}) / ${h.subject} / ${h.author.name}】`,
        h.todaysContent ? `今日の内容: ${h.todaysContent}` : "",
        h.achieved ? `できたこと: ${h.achieved}` : "",
        h.notAchieved ? `できなかったこと: ${h.notAchieved}` : "",
        h.improvement ? `改善策: ${h.improvement}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");

  const prompt = `以下は学習塾の${year}年${month}月の全授業引継書データです（${handovers.length}件）。
塾全体の月次まとめレポートをMarkdown形式で作成してください。

## 引継書データ

${records}

---

## 出力形式

# ${year}年${month}月 塾全体まとめレポート

## 1. 全体サマリー
## 2. 科目別傾向
## 3. よく見られた課題と改善策
## 4. 来月への申し送り事項
## 5. 授業実施状況（合計 ${handovers.length} 件）`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude API");
  return content.text;
}
