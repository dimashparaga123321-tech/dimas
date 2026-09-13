/**
 * Страница-переадресация для старой ссылки на GitHub Pages.
 * Сохраняет путь и якорь: /dimas/#services → новый-сайт/#services.
 */
import { mkdir, writeFile } from "node:fs/promises";

const TARGET = "https://webbots.dimashparaga123321.workers.dev";
const BASE_PATH = "/dimas";

const page = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Web&amp;Bots переехал</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${TARGET}/">
<meta http-equiv="refresh" content="0; url=${TARGET}/">
<script>
  var path = location.pathname.indexOf("${BASE_PATH}") === 0 ? location.pathname.slice(${BASE_PATH.length}) : location.pathname;
  location.replace("${TARGET}" + (path || "/") + location.search + location.hash);
</script>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#12110f; color:#f0ece4; font:500 16px/1.5 Arial,sans-serif; text-align:center; }
  a { color:#c69965; }
</style>
</head>
<body>
  <p>Сайт Web&amp;Bots переехал.<br><a href="${TARGET}/">Открыть новый адрес</a></p>
</body>
</html>
`;

const outDir = new URL("../pages-redirect/", import.meta.url);
await mkdir(outDir, { recursive: true });
await writeFile(new URL("index.html", outDir), page);
// 404 тоже перекидывает: старые ссылки на любые страницы попадут на новый сайт.
await writeFile(new URL("404.html", outDir), page);
await writeFile(new URL(".nojekyll", outDir), "");

console.log(`Переадресация на ${TARGET} готова`);
