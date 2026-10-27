# コンテンツ (記事・カテゴリ) の扱い

## 記事

- 記事は `content/article/<uuid>/index.mdx` に置きます。ディレクトリ名の `<uuid>` は frontmatter の `uuid` と一致させてください。slug は変わりうるので、パスは uuid ベースです。
- 画像はその記事の `content/article/<uuid>/assets/<imageId>.avif` に置きます。形式は AVIF 固定です。
- frontmatter は hagaki 仕様に準拠します。

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
    userId: f8b761ec-4a54-48eb-a040-c5604042bcc9
---
```

- `category` は `content/categories/<slug>.json` に存在する slug を指定してください。
- `draft: true` の記事は `article.json` / `slug-index.json` に載らず、配信 worker も `/article/<uuid>/*` を 404 にします。

## 本文 (MDX)

- 本文は MDX です。画像は必ず `<Image />` で書きます。生の Markdown 画像記法や `<img>` は使わないでください。

```mdx
<Image imageId="98e879e4-…" blurHash64="VUhLMGc4…" width="1920" height="1080" alt="説明" />
```

## `modified` (移行元の編集履歴)

- 編集履歴の一次ソースは git のコミット履歴です。`modified` は **git 以前 (旧 wiki) の履歴** だけを持ちます。新しい編集で `modified` を追記しないでください。
- 旧 wiki からの移行記事では次を入れています。
  - `modified[0]` = 旧 wiki の `date` (記事の作成/最終更新日時)
  - 本文末尾にあった「編集者: …／最終更新日: …」の記述を拾えた場合はその分も追加
- `userId` は編集者の認証ユーザー ID (better-auth の `session.user.id`) です。hagaki は ID の中身を解釈しません。この wiki は MineAuth でログインするため、値は Minecraft の UUID になります。
- 旧 wiki は編集者を Minecraft の **表示名** でしか記録していないため、Mojang API で UUID を解決できたものだけ `userId` を持ちます (解決できないものは `userId` を省略)。`hagaki generate` は `userId` が無いエントリを `userId: null` として扱います。
- このキーは以前 `player` でした。hagaki 0.4 の改名 (破壊的変更) に合わせて全記事を `userId` に書き換えています。hagaki 0.4 は `player` を読みません。
- この書き換えのマージ順序は次のとおりです。順序を崩さないでください。
  1. `userId` に改名した hagaki (0.4.0) をリリースする。
  2. 同じ PR で `pnpm update @morinoparty/hagaki` を実行し、lockfile をコミットする (lockfile が 0.2.0 のままだと `pnpm install --frozen-lockfile` が失敗する)。
  3. wiki-frontend を `userId` を読み書きできる hagaki に上げてデプロイする。hagaki 0.3 のままの wiki-frontend が `userId` の記事を保存すると、`modified` が丸ごと消える。wiki-frontend の更新とマージを同時に行うか、それまでダッシュボードからの編集を止める。

## `editors` (manifest の生成物)

`article.json` の各エントリは、`info.json` の `history` をユーザー (`userId`) ごとに畳んだ `editors` を持ちます。

```json
"editors": [
  { "userId": "85c6a9e3-…", "edits": 3, "lastEditedAt": "2026-08-09T15:13:17.000Z" }
]
```

`userId` が分からない履歴 (移行前の表示名のみの記録、コミッター名が `"<name> (<userId>)"` 規約でないコミット) は含みません。wiki-frontend のダッシュボードが「自分が編集に関わった記事」を出すのに使うため、記事数ぶんの `info.json` を引かなくて済むよう manifest 側にも載せています。

## カテゴリ

- カテゴリは `content/categories/<slug>.json` に置きます (`title`, `slug`, `body`, 任意の `option`)。ファイル名と `slug` を一致させてください。
- `option` はそのカテゴリの記事が持つ追加項目の定義です。

## 生成物

- `content/article.json` / `content/slug-index.json` / `content/categories.json` / `content/article/*/info.json` は生成物で、git 管理外 (`.gitignore`) です。手で編集したりコミットしたりしないでください。
- `cf build` / `cf dev` が `wrangler.config.ts` の `build.command` で毎回 `hagaki generate` を実行して作り直します (単体で作るなら `pnpm run generate`)。
