@AGENTS.md

# セットアップメモ

## 室長（ADMIN）アカウント
- `node scripts/create-admin.js` で初期ADMINユーザーを作成・`.env`のハッシュ更新を行う
- `.env` の `ADMIN_PASSWORD_HASH` はシングルクォートで囲む（`$` がNext.jsに展開されるのを防ぐため）
- auth.ts に `trustHost: true` を設定済み（LAN内スマホからのアクセス対応）

## スマホデバッグ
- `npm run dev -- --hostname 0.0.0.0` でLAN公開
- スマホからは `http://192.168.11.6:3000` でアクセス
- JSが動かない場合は `npm run build && npm run start -- --hostname 0.0.0.0`（本番ビルド）で試す
- iPhoneのデバッグはngrok推奨

## モバイル対応
- PC: 左サイドバー（`md:flex`）
- スマホ: ボトムナビゲーション（`src/components/layout/MobileNav.tsx`）
