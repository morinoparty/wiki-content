# wiki-content

MoripaWiki ([wiki-frontend](https://github.com/morinoparty/wiki-frontend)) のコンテンツリポジトリ。
[hagaki のコンテンツフォーマット](https://github.com/Nlkomaru/hagaki/blob/main/sample/README.md)に従い、
`content/` を Cloudflare Workers (Workers Assets) で配信します。index 群の生成
(`hagaki generate`) と配信 worker (`hagaki/content-worker`) は
[hagaki](https://github.com/Nlkomaru/hagaki) をライブラリとして使います。

- 配信 URL: `https://wiki-content.<subdomain>.workers.dev` (Worker 名 `wiki-content`。独自ドメインなし)
- デプロイ: Cloudflare CLI [`cf`](https://developers.cloudflare.com/cf/) (beta)。main への push で GitHub Actions が実行

## 構成

```
.
├── cloudflare.config.ts        # Worker 定義 (名前、assets、run_worker_first、バインディング)
├── wrangler.config.ts          # ビルド設定 (assets ディレクトリ、build.command = hagaki generate)
├── src/index.ts                # 配信 worker (hagaki/content-worker の createContentApp)
├── .github/workflows/deploy.yml
└── content/
    ├── article/
    │   └── <uuid>/                 # 記事ディレクトリ (uuid = frontmatter の uuid)
    │       ├── index.mdx           #   記事本体 (frontmatter + MDX)
    │       ├── info.json           #   ← 生成物 (履歴マージ済みメタデータ)
    │       └── assets/
    │           └── <imageId>.avif  #   その記事に属する画像 (AVIF 固定)
    ├── categories/<slug>.json      # カテゴリ定義
    ├── article.json                # ← 生成物: 全記事 manifest
    ├── slug-index.json             # ← 生成物: slug → uuid マップ
    └── categories.json             # ← 生成物: カテゴリ一覧
```

生成物 (`article.json` / `slug-index.json` / `categories.json` /
`article/*/info.json`) は git 管理外です。`cf build` / `cf dev` が
`wrangler.config.ts` の `build.command` で毎回 `hagaki generate` を実行して
作り直します (単体で作るなら `pnpm generate`)。`draft: true` の記事は
`article.json` / `slug-index.json` に載りません。`info.json` の履歴は
git log から作るため、浅い clone では履歴が欠けます。

> [!NOTE]
> hagaki は `github:Nlkomaru/hagaki#dist`（hagaki の CI が main への push ごとに
> 発行するビルド済みブランチ）への依存で、lockfile がそのコミット SHA を
> 固定します。hagaki 側の更新を反映するには `pnpm update hagaki` を実行して
> lockfile をコミットしてください。

## 配信パス

`/article/*` は `runWorkerFirst` で `hagaki/content-worker` の Hono app
(`src/index.ts`) を通り、`draft: true` の記事 (`index.mdx` / `info.json` /
`assets/*`) は 404 になります。manifest 類はそのまま静的配信します。

| パス | 内容 |
|---|---|
| `/article.json` | 記事一覧 (`hagaki.posts.list()`) |
| `/slug-index.json` | slug → uuid マップ (`getPostBySlug` の O(1) 解決用) |
| `/article/<uuid>/index.mdx` | 個別記事 |
| `/article/<uuid>/info.json` | 記事メタデータ (履歴マージ済み) |
| `/article/<uuid>/assets/<imageId>.avif` | その記事の画像 |
| `/categories.json` | カテゴリ一覧 |

## 記事フォーマット

frontmatter は hagaki 仕様に準拠します。

```yaml
---
title: チャットについて！日本語入力の仕方など
slug: chat
uuid: 0e95538c-f931-4616-8b39-88cb608c90b4
category: zarchive
description: 森パのゲーム内チャットについての説明です！
thumbnail:
  imageId: 98e879e4-d625-4ca7-8e20-4df80ab0c285
  blurhash64: VUhLMGc4JCV4XlZzfld4dFJpdFIlZ05iTXtWQHNTb2ZWQHNv
modified:
  - date: 2022-02-19T02:25:05.827Z
    player: f8b761ec-4a54-48eb-a040-c5604042bcc9
---
```

本文は MDX。画像は必ず `<Image />` で書きます (生の Markdown 画像記法や
`<img>` は使いません)。

```mdx
<Image imageId="98e879e4-…" blurHash64="VUhLMGc4…" width="1920" height="1080" alt="説明" />
```

### `modified` (移行元の編集履歴)

編集履歴の一次ソースは git のコミット履歴です。`modified` は
**git 以前 (旧 wiki) の履歴**だけを持ちます。旧 wiki からの移行記事では

- `modified[0]` = 旧 wiki の `date` (記事の作成/最終更新日時)
- 本文末尾にあった「編集者: …／最終更新日: …」の記述を拾えた場合はその分も追加

を入れています。旧 wiki は編集者を Minecraft の**表示名**でしか記録していないため、
Mojang API で UUID を解決できたものだけ `player` を持ちます (解決できないものは
`player` を省略)。`hagaki generate` は `player` が無いエントリを `player: null`
として扱います。

### `editors` (manifest の生成物)

`article.json` の各エントリは、`info.json` の `history` をプレイヤーごとに畳んだ
`editors` を持ちます。

```json
"editors": [
  { "player": "85c6a9e3-…", "edits": 3, "lastEditedAt": "2026-08-09T15:13:17.000Z" }
]
```

`player` が解決できない履歴 (移行前の表示名のみの記録、`"<name> (<uuid>)"` 規約で
ないコミット) は含みません。wiki-frontend のダッシュボードが「自分が編集に
関わった記事」を出すのに使うため、記事数ぶんの `info.json` を引かなくて済むよう
manifest 側にも載せています。

## ローカル開発

Node.js 26.12 以上 (`.node-version`) と pnpm 12 (`packageManager`) を使います。

```sh
pnpm install
pnpm exec cf dev    # hagaki generate → http://localhost:8787
```

## デプロイ

### GitHub Actions

`.github/workflows/deploy.yml` が次を実行します。

- pull request / 手動実行 (workflow_dispatch): typecheck → `cf build` → `cf deploy --dry-run` (アップロードしない)
- main への push: 上記に続けて `cf deploy` で本番反映

checkout は `fetch-depth: 0` (info.json の履歴マージに全履歴が必要) です。

### 手動

```sh
pnpm exec cf build --mode production
pnpm exec cf deploy --prebuilt --mode production
```

`cf` はカレントディレクトリの `.env` から `CLOUDFLARE_ACCOUNT_ID` /
`CLOUDFLARE_API_TOKEN` を読みます。

## 初回セットアップ

1. Cloudflare API token を発行する
   (<https://dash.cloudflare.com/profile/api-tokens> → **Edit Cloudflare Workers** テンプレート)
2. `.env.example` を `.env` にコピーし、`CLOUDFLARE_ACCOUNT_ID` と `CLOUDFLARE_API_TOKEN` を埋める
   (`.env` は git 管理外)
3. GitHub Actions の secrets に登録する

   ```sh
   gh secret set -f .env
   ```

## wiki-frontend との連携

wiki-frontend はこのリポジトリを

- 読み取り: `https://wiki-content.<subdomain>.workers.dev` (Workers Assets)
- 書き込み: GitHub API 経由のコミット (`morinoparty/wiki-content`)

として参照します。エディタからの保存はこのリポジトリへのコミットとして届き、
main に入ると Actions が走って worker に反映されます。

## 移行元

記事は [morinoparty/wiki](https://github.com/morinoparty/wiki) (Nuxt.js +
NetlifyCMS 時代の wiki) の `assets/content/wiki/*.json` と `static/img/` から
移行しました。画像は AVIF (最大 1920px, quality 50) に変換し、blurhash を
base64 で保持しています。
