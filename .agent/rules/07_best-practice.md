# 推奨される書き方

## デプロイ・インフラ
- デプロイは `.github/workflows/deploy.yml` が行います。pull request / 手動実行 (workflow_dispatch) では typecheck → `cf build` → `cf deploy --dry-run` まで (アップロードしない)、main への push で `cf deploy` により本番反映されます。
- main に入った変更はそのまま本番の Worker に反映されるので、ローカルでの `cf deploy` (dry-run 以外) は行わないでください。
- checkout は `fetch-depth: 0` です。`info.json` の履歴マージに全履歴が必要なので、浅い clone に変えないでください。
- `cloudflare.config.ts` には `accountId` を書かないでください。`CLOUDFLARE_ACCOUNT_ID` (`.env` / GitHub secrets) で渡します。
- `.env` は git 管理外です。秘密情報 (`CLOUDFLARE_API_TOKEN` など) をコミットしないでください。新しい環境変数を足すときは `.env.example` にもキーだけを追加してください。
- 独自ドメインは持たず、workers.dev (`workersDev: true`) で配信します。
- `runWorkerFirst` は draft 遮断が必要な `/article/*` だけにしています。manifest やカテゴリまで worker を通すと不要なリクエストが増えるので、範囲を広げるときは理由を明確にしてください。

## 初回セットアップ
1. Cloudflare API token を発行する (<https://dash.cloudflare.com/profile/api-tokens> → **Edit Cloudflare Workers** テンプレート)
2. `.env.example` を `.env` にコピーし、`CLOUDFLARE_ACCOUNT_ID` と `CLOUDFLARE_API_TOKEN` を埋める
3. GitHub Actions の secrets に登録する (`gh secret set -f .env`)。これはリモートの状態を変えるので、ユーザーに確認してから行ってください。

## 依存関係
- `@morinoparty/hagaki` は GitHub Packages にあります (`.npmrc` で `@morinoparty` スコープを `https://npm.pkg.github.com` に向けています)。
- `pnpm-workspace.yaml` の `minimumReleaseAgeExclude` に、公開から日が浅いため例外扱いしているパッケージの版が並んでいます。版を上げるときは必要に応じてここも更新してください。

## コンテンツ
- 記事の編集は通常 wiki-frontend のエディタからコミットとして届きます。手で記事を直すときも、エディタが出力する形式 (frontmatter、`<Image />`) に合わせてください。
- 画像を追加するときは AVIF に変換し、`<Image />` の `imageId` とファイル名 (`assets/<imageId>.avif`) を一致させてください。
