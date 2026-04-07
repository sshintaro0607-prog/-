/**
 * 室長（ADMIN）アカウント初期セットアップスクリプト
 *
 * 実行方法:
 *   node scripts/create-admin.js
 *
 * やること:
 *   1. パスワードを bcrypt でハッシュ化
 *   2. DB に ADMIN ユーザーを INSERT（重複時はスキップ）
 *   3. .env / .env.local の ADMIN_PASSWORD_HASH を更新
 */

const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// dotenv を手動でロード（package.json に dotenv が入っているため require 可）
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const ADMIN_NAME = "室長";
const ADMIN_PASSWORD = "371868";
const BCRYPT_ROUNDS = 12;

async function updateEnvFile(filePath, hash) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf-8");
  // シングルクォートで囲む（Next.jsが$をenv変数として展開するのを防ぐ）
  if (/^ADMIN_PASSWORD_HASH=.*/m.test(content)) {
    content = content.replace(/^ADMIN_PASSWORD_HASH=.*/m, `ADMIN_PASSWORD_HASH='${hash}'`);
  } else {
    content += `\nADMIN_PASSWORD_HASH='${hash}'`;
  }
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`  ✓ ${path.basename(filePath)} を更新しました`);
}

async function main() {
  console.log("=== 室長アカウント セットアップ ===\n");

  // 1. ハッシュ生成
  console.log("パスワードをハッシュ化しています...");
  const hash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  console.log(`  ✓ ハッシュ生成完了\n`);

  // 2. DB に ADMIN ユーザーを INSERT
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("データベースに接続しました");

  try {
    const result = await client.query(
      `INSERT INTO users (name, role, password_hash, is_active, updated_at)
       VALUES ($1, 'ADMIN', $2, true, NOW())
       ON CONFLICT DO NOTHING
       RETURNING id, name`,
      [ADMIN_NAME, hash]
    );

    if (result.rowCount > 0) {
      const row = result.rows[0];
      console.log(`  ✓ ユーザー「${row.name}」を作成しました（ID: ${row.id}）`);
    } else {
      console.log(`  ℹ「${ADMIN_NAME}」はすでに存在するためスキップしました`);
    }
  } finally {
    await client.end();
  }

  // 3. .env / .env.local を更新
  console.log("\n環境変数ファイルを更新しています...");
  const root = path.join(__dirname, "..");
  await updateEnvFile(path.join(root, ".env"), hash);
  await updateEnvFile(path.join(root, ".env.local"), hash);

  console.log("\n=== 完了 ===");
  console.log(`ログイン情報:`);
  console.log(`  パスワード: ${ADMIN_PASSWORD}`);
  console.log(`\n開発サーバーを再起動してからログインしてください。`);
  console.log(`  npm run dev`);
}

main().catch((err) => {
  console.error("エラーが発生しました:", err.message);
  process.exit(1);
});
