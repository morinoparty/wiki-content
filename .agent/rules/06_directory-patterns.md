## ディレクトリ配置規則

- content/article/<uuid>/index.mdx に記事本体 (frontmatter + MDX) を配置します。
- content/article/<uuid>/assets/<imageId>.avif にその記事に属する画像を配置します。
- content/categories/<slug>.json にカテゴリ定義を配置します。
- src/index.ts に配信 worker のエントリポイントを配置します (`cloudflare.config.ts` の `entrypoint`)。
- cloudflare.config.ts に Worker 定義 (名前、assets、runWorkerFirst、バインディング) を配置します。
- wrangler.config.ts にビルド設定 (assetsDirectory = `./content`、build.command = hagaki generate) を配置します。
- .github/workflows/deploy.yml に CI / デプロイのワークフローを配置します。
- README.md にドキュメントを配置します。
- content/article.json、content/slug-index.json、content/categories.json、content/article/*/info.json は生成物です。git 管理外なので配置・コミットしないでください。
- .cloudflare/ と .wrangler/ は cf / wrangler の出力・キャッシュで、git 管理外です。
