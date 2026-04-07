@AGENTS.md

# セットアップメモ

## 室長（ADMIN）アカウント
- `node scripts/create-admin.js` で初期ADMINユーザーを作成・`.env`のハッシュ更新を行う
- `.env` の `ADMIN_PASSWORD_HASH` はシングルクォートで囲む（`$` がNext.jsに展開されるのを防ぐため）
- auth.ts に `trustHost: true` を設定済み（LAN内スマホからのアクセス対応）

## スマホデバッグ
- `npm run build && npm run start -- --hostname 0.0.0.0` でLAN公開（本番ビルド必須）
- devサーバーだとiPhoneでJSが動かない（localhostを参照してしまうため）
- スマホからは `http://192.168.11.6:3000` でアクセス
- iPhone機能確認済み

## モバイル対応
- PC: 左サイドバー（`md:flex`）
- スマホ: ボトムナビゲーション（`src/components/layout/MobileNav.tsx`）
