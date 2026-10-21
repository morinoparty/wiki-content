import { bindings, defineConfig } from "cf/config";

// accountId は書かない。CLOUDFLARE_ACCOUNT_ID (.env / GitHub secrets) で渡す。
export default defineConfig({
	worker: {
		name: "wiki-content",
		compatibilityDate: "2026-10-01",
		entrypoint: "src/index.ts",
		// 独自ドメインは持たず、https://wiki-content.<subdomain>.workers.dev で配信する
		workersDev: true,
		assets: {
			// draft 遮断が必要な記事パスだけ worker (createContentApp) を通す。
			// manifest / カテゴリは asset-first で静的配信する。
			runWorkerFirst: ["/article/*"],
		},
		env: {
			ASSETS: bindings.assets(),
		},
	},
});
