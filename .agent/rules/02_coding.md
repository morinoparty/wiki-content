# コーディングプラクティス

## 実装手順

1. **型設計**
   - まず型 (interface / type) を定義

2. **純粋関数から実装**
   - 外部依存のない関数を先に実装

## プラクティス

- 小さく始めて段階的に拡張
- 過度な抽象化を避ける
- コードよりも型を重視
- 複雑さに応じてアプローチを調整

## コードスタイル

- 常に既存コードの設計や記法を参考にしてください。
- このリポジトリのコードは `src/index.ts` と設定ファイル (`cloudflare.config.ts`, `wrangler.config.ts`) だけです。配信ロジックは hagaki (`@morinoparty/hagaki/content-worker`) 側にあるので、ここに独自ロジックを足す前に hagaki 側で対応すべきかを検討してください。
- 書籍「リーダブルコード」のようなベストプラクティスを常に適用してください。
- コードの意図・背景などのコメントを日本語で積極的に入れてください (`src/index.ts` の既存コメントは英語なので、そのファイルでは周囲に合わせて構いません)。
- TypeScript は strict (`tsconfig.json`) で書いてください。
- パッケージ管理には pnpm を使ってください (`pnpm install`, `pnpm add <pkg>`, `pnpm exec <cmd>`)。npm / npx は使わないでください。
- コードや設定を書いた後は、`pnpm run typecheck` と `pnpm run build` を実行して、型チェックとビルドが通ることを確認してください。
- 作業後に勝手にデプロイ (`pnpm run deploy`, `cf deploy`) を行わないでください。

## ビルド・確認コマンド

- 依存関係のインストール: `pnpm install` (`@morinoparty/hagaki` は npm から入るのでトークン不要)
- 型チェック: `pnpm run typecheck` (`cf workers types && tsc`)
- ビルド: `pnpm run build` (`cf build --mode production`。`wrangler.config.ts` の `build.command` で `hagaki generate` が走り、index 群を作り直す)
- index 群だけを生成: `pnpm run generate` (`hagaki generate`)
- ローカル開発サーバー: `pnpm run dev` (`cf dev`、`hagaki generate` → http://localhost:8787)
- デプロイの検証 (アップロードしない): `pnpm exec cf deploy --prebuilt --mode production --dry-run` (`cf build` の後に実行)
- hagaki の更新: `pnpm update @morinoparty/hagaki` を実行して lockfile をコミット

`cf` はカレントディレクトリの `.env` から `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` を読みます。`cloudflare.config.ts` があるリポジトリのルート以外で `cf dev` / `cf build` / `cf deploy` を実行しないでください。

## 補足

`info.json` の履歴は git log から作るため、浅い clone では履歴が欠けます。ビルド結果の履歴がおかしいときは clone の深さを確認してください。
