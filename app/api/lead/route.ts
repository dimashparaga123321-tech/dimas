import { env } from "cloudflare:workers";
import {
  MODULES,
  SITE_TYPES,
  formatPhone,
  isValidEmail,
  isValidPhone,
  isValidTelegram,
  normalizeTelegram,
  type Brief,
  type ModuleId,
  type SiteType,
} from "../../brief";

export const dynamic = "force-dynamic";

interface TelegramEnv {
  BOT_TOKEN?: string;
  CHAT_ID?: string;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function text(value: unknown, limit = 120): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

/** Telegram падает на «<» и «&» в режиме HTML, если их не экранировать. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMessage(brief: Brief): string {
  const siteType = SITE_TYPES.find((t) => t.id === brief.siteType)?.title ?? "—";
  const modules = brief.modules
    .map((id) => MODULES.find((m) => m.id === id))
    .filter((m): m is (typeof MODULES)[number] => Boolean(m))
    .map((m) => `${m.icon} ${m.title}`)
    .join("\n");

  const phoneLink = `+${brief.phone.replace(/\D/g, "")}`;

  return [
    "<b>📝 Новая заявка · Web&amp;Bots</b>",
    "",
    `<b>Бизнес:</b> ${escapeHtml(brief.businessName)}`,
    `<b>Чем занимается:</b> ${escapeHtml(brief.businessType)}`,
    `<b>Название сайта:</b> ${escapeHtml(brief.siteName) || "—"}`,
    `<b>Тип сайта:</b> ${escapeHtml(siteType)}`,
    "",
    "<b>Модули:</b>",
    modules ? escapeHtml(modules) : "—",
    "",
    `<b>Телефон:</b> <a href="tel:${phoneLink}">${escapeHtml(brief.phone)}</a>`,
    `<b>Telegram:</b> ${escapeHtml(brief.telegram) || "—"}`,
    `<b>Почта:</b> ${escapeHtml(brief.email) || "—"}`,
  ].join("\n");
}

export async function POST(request: Request) {
  let payload: { brief?: unknown };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json({ ok: false, error: "Не удалось прочитать заявку" }, 400);
  }

  const raw = (payload.brief ?? {}) as Partial<Record<keyof Brief, unknown>>;
  const validModules = new Set<string>(MODULES.map((m) => m.id));

  const brief: Brief = {
    businessName: text(raw.businessName),
    businessType: text(raw.businessType, 200),
    siteName: text(raw.siteName),
    siteType: (SITE_TYPES.some((t) => t.id === raw.siteType) ? raw.siteType : "") as SiteType | "",
    modules: (Array.isArray(raw.modules) ? raw.modules : []).filter(
      (id): id is ModuleId => typeof id === "string" && validModules.has(id)
    ),
    phone: text(raw.phone, 30),
    email: text(raw.email, 120),
    telegram: text(raw.telegram, 40),
  };

  // Проверяем на сервере то же, что и в форме: запрос можно отправить в обход сайта.
  if (!brief.businessName || brief.businessType.length < 2) {
    return json({ ok: false, error: "Укажите название бизнеса и чем вы занимаетесь" }, 400);
  }
  if (!isValidPhone(brief.phone)) {
    return json({ ok: false, error: "Проверьте номер телефона" }, 400);
  }
  if (!isValidEmail(brief.email)) {
    return json({ ok: false, error: "Проверьте адрес почты" }, 400);
  }
  if (!isValidTelegram(brief.telegram)) {
    return json({ ok: false, error: "Проверьте ник в Telegram" }, 400);
  }

  brief.phone = formatPhone(brief.phone);
  brief.telegram = normalizeTelegram(brief.telegram);

  const { BOT_TOKEN, CHAT_ID } = env as unknown as TelegramEnv;

  if (!BOT_TOKEN || !CHAT_ID) {
    return json(
      {
        ok: false,
        code: "TELEGRAM_NOT_CONFIGURED",
        error: "Приём заявок ещё настраивается. Попробуйте, пожалуйста, чуть позже.",
      },
      503
    );
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: formatMessage(brief),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      return json({ ok: false, error: "Заявка не дошла. Попробуйте отправить ещё раз через минуту." }, 502);
    }

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "Заявка не дошла. Попробуйте отправить ещё раз через минуту." }, 502);
  }
}
