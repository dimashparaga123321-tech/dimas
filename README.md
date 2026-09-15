# Web&Bots — сайт

Живой сайт: **https://webbots.dimashparaga123321.workers.dev** (Cloudflare Workers).
Здесь код сайта. Telegram-бот для заявок лежит в отдельном репозитории `webbots-bot`.

## Работа на Макбуке

1. Поставить Node.js 22 или новее: https://nodejs.org (кнопка LTS).
2. Скачать код и зайти в папку:
   ```bash
   git clone https://github.com/dimashparaga123321-tech/dimas.git webbots
   cd webbots
   npm install
   ```
3. Запустить сайт у себя: `npm run dev` → открыть http://127.0.0.1:3000
   - С живым ИИ-чатом: один раз `npx wrangler login`, потом `CF_AI=1 npm run dev`.
4. Выложить на Cloudflare: `npx wrangler login` (один раз), потом `npm run deploy`.
5. Сохранить правки на GitHub: `git add -A && git commit -m "что поменял" && git push`.

Перед работой на другом компьютере — `git pull`, чтобы забрать свежие правки.

⚠️ Push на GitHub **не обновляет** живой сайт — только `npm run deploy`.
Файлы `.cmd` в соседней папке — только для Windows, на Маке они не нужны.

## Главные файлы

- `app/page.tsx` — страница, `app/globals.css` — стили
- `app/ChatWidget.tsx` — чат в углу (заявка и вопросы ИИ)
- `app/knowledge.ts` — что знает ИИ-помощник
- `app/api/chat/route.ts` — ИИ, `app/botLink.ts` — связь с Telegram-ботом
- `scripts/ai-eval.mjs` — прогон ИИ по каверзным вопросам (сайт должен быть запущен)

---

# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Email and name are intended for display or contact purposes.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
