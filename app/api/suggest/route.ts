import { explicitModules, suggestModules } from "../../suggest";

export const dynamic = "force-dynamic";

/** По описанию бизнеса возвращает модули и тип сайта, которые стоит отметить заранее. */
export async function POST(request: Request) {
  let payload: { text?: unknown };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ modules: [] }, { status: 400 });
  }

  const text = typeof payload.text === "string" ? payload.text.slice(0, 300) : "";
  if (!text.trim()) return Response.json({ modules: [] });

  const suggestion = suggestModules(text);
  const modules = [...new Set([...suggestion.modules, ...explicitModules(text)])];

  return Response.json({ modules, siteType: suggestion.siteType ?? "", label: suggestion.label ?? "" });
}
