## このアプリケーションの概要
「もりぱうぃき (MoripaWiki)」のコンテンツリポジトリです。
リポジトリ名は `wiki-content` です。

フロントエンドは別リポジトリの [wiki-frontend](https://github.com/morinoparty/wiki-frontend) で、このリポジトリは記事本体・画像・カテゴリ定義と、それを配信する Cloudflare Worker だけを持ちます。

## 目的
[hagaki のコンテンツフォーマット](https://github.com/morinoparty/hagaki/blob/main/sample/README.md) に従った `content/` を、Cloudflare Workers (Workers Assets) で配信します。

- 配信先: Worker 名 `wiki-content` (`https://wiki-content.<subdomain>.workers.dev`。workers.dev のみで独自ドメインなし)
- index 群の生成 (`hagaki generate`) と配信 worker (`hagaki/content-worker`) は [hagaki](https://github.com/morinoparty/hagaki) をライブラリとして使います。
- `src/index.ts` は `@morinoparty/hagaki/content-worker` の `createContentApp()` をそのまま export します。`/article/*` だけが `runWorkerFirst` でこの Hono app を通り、`draft: true` の記事 (`index.mdx` / `info.json` / `assets/*`) は 404 になります。manifest やカテゴリは asset-first で静的配信します。

### 配信パス

| パス | 内容 |
|---|---|
| `/article.json` | 記事一覧 (`hagaki.posts.list()`) |
| `/slug-index.json` | slug → uuid マップ (`getPostBySlug` の O(1) 解決用) |
| `/article/<uuid>/index.mdx` | 個別記事 |
| `/article/<uuid>/info.json` | 記事メタデータ (履歴マージ済み) |
| `/article/<uuid>/assets/<imageId>.avif` | その記事の画像 |
| `/categories.json` | カテゴリ一覧 |

### wiki-frontend との連携
wiki-frontend はこのリポジトリを次のように参照します。

- 読み取り: `https://wiki-content.<subdomain>.workers.dev` (Workers Assets)
- 書き込み: GitHub API 経由のコミット (`morinoparty/wiki-content`)。エディタからの保存はこのリポジトリへのコミットとして届き (コミットメッセージ例: `📝 Update post: <slug>`、画像の増減があれば `(+1 image)` などが付く。author は `<表示名> (<プレイヤー UUID>)`)、main に入ると GitHub Actions が走って Worker に反映されます。

配信パスや manifest の形を変えると wiki-frontend の読み取りが壊れるので、変更する場合は wiki-frontend 側への影響を必ず確認してください。

### 移行元
記事は [morinoparty/wiki](https://github.com/morinoparty/wiki) (Nuxt.js + NetlifyCMS 時代の wiki) の `assets/content/wiki/*.json` と `static/img/` から移行しました。画像は AVIF (最大 1920px, quality 50) に変換し、blurhash を base64 で保持しています。

## 主な技術スタック
- TypeScript (`src/index.ts` と設定ファイル。`tsconfig.json` は strict)
- MDX (記事本体。frontmatter は hagaki 仕様)
- [hagaki](https://github.com/morinoparty/hagaki) (`@morinoparty/hagaki`。GitHub Packages から取得。index 生成と配信 worker)
- Cloudflare Workers + Workers Assets
- Cloudflare CLI `cf` (beta, `cf@1.0.0-beta.20`) と wrangler (`wrangler/experimental-config` によるビルド設定)
- pnpm 12 (`packageManager: pnpm@12.14.0`) / Node.js 26.12 以上 (`.node-version`, `engines`)
- GitHub Actions (`.github/workflows/deploy.yml`)

## 構成

```
.
├── cloudflare.config.ts        # Worker 定義 (名前、assets、runWorkerFirst、バインディング)
├── wrangler.config.ts          # ビルド設定 (assetsDirectory、build.command = hagaki generate)
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
