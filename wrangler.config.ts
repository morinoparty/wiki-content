import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({
	// cf dev / cf build の前に index 群 (article.json, slug-index.json,
	// categories.json, article/<uuid>/info.json) を content/ に生成する。
	// info.json の履歴は git log から作るので、全履歴のある clone が必要。
	build: {
		command: "node_modules/.bin/hagaki generate",
	},
	assetsDirectory: "./content",
});
