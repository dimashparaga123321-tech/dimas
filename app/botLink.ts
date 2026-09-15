/**
 * Связь чата на сайте с Telegram-ботом Web&Bots (отдельный проект в папке tg-bot).
 *
 * После заявки бот выдаёт одноразовую ссылку на себя. Клиент открывает её — и дальше
 * переписывается с Димой в Telegram. Ссылка потерялась или не открылась — помощник
 * на сайте просит у бота новую. Чтобы чужой человек не выпросил ссылку к чужой заявке,
 * номер заявки и её секрет хранятся только в браузере, из которого её отправили.
 */

export const BOT_URL = "https://webbots-bot.dimashparaga123321.workers.dev";

const LEAD_KEY = "webbots-lead";

export interface SavedLead {
  leadId: string;
  secret: string;
}

export function saveLead(lead: SavedLead): void {
  try {
    localStorage.setItem(LEAD_KEY, JSON.stringify(lead));
  } catch {
    // Приватный режим: новую ссылку тогда выдать не выйдет, но заявка уже у Димы.
  }
}

export function loadLead(): SavedLead | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEAD_KEY) ?? "null") as Partial<SavedLead> | null;
    return parsed?.leadId && parsed.secret ? { leadId: parsed.leadId, secret: parsed.secret } : null;
  } catch {
    return null;
  }
}

/**
 * Жалуется ли человек, что не может попасть в чат с Димой.
 * Слово «ссылка» — почти наверняка про это. «Бот» или «телеграм» — только вместе
 * с жалобой, иначе вопрос «а ботов вы делаете?» выдал бы ссылку не к месту.
 */
export function isLinkTrouble(text: string): boolean {
  const value = text.toLowerCase().replace(/ё/g, "е");
  const problem =
    /(не\s*(работает|открывается|открылась|пускает|могу|получается|заходит|зайти|войти)|сломал|пропал|потерял|вылет|выкинул|заново|снова|еще раз|нов(ую|ая))/;
  if (/ссылк/.test(value)) return true;
  return /(бот|телеграм|telegram|тг|чат с димой|переписк)/.test(value) && problem.test(value);
}

export type LinkResult =
  | { ok: true; link: string }
  | { ok: false; reason: "no-lead" | "not-found" | "offline" };

/** Попросить у бота свежую ссылку. Старая при этом сгорает. */
export async function requestNewLink(): Promise<LinkResult> {
  const lead = loadLead();
  if (!lead) return { ok: false, reason: "no-lead" };

  try {
    const response = await fetch(`${BOT_URL}/lead/link`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; link?: string; code?: string } | null;
    if (data?.ok && data.link) return { ok: true, link: data.link };
    return { ok: false, reason: data?.code === "LEAD_NOT_FOUND" ? "not-found" : "offline" };
  } catch {
    return { ok: false, reason: "offline" };
  }
}
