import { readFile, writeFile } from "node:fs/promises";

const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? "/dimas";
const outputDirectory = new URL("../dist/client/", import.meta.url);

for (const fileName of ["index.html", "index.rsc", "404.html"]) {
  const fileUrl = new URL(fileName, outputDirectory);
  const contents = await readFile(fileUrl, "utf8");
  await writeFile(fileUrl, contents.replaceAll('"/_next/', `"${basePath}/_next/`));
}

await writeFile(new URL(".nojekyll", outputDirectory), "");
