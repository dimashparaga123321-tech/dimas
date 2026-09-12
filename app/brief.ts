/** Справочник модулей, типов сайта и полей заявки. Общий для клиента и API. */

export type ModuleId =
  | "hero"
  | "catalog"
  | "lead"
  | "booking"
  | "gallery"
  | "reviews"
  | "contacts"
  | "faq"
  | "blog"
  | "tgbot"
  | "aichat"
  | "i18n";

export interface ModuleInfo {
  id: ModuleId;
  icon: string;
  title: string;
  hint: string;
}

export const MODULES: ModuleInfo[] = [
  { id: "hero", icon: "🎯", title: "Главный экран", hint: "Первое, что видит клиент: чем вы полезны" },
  { id: "catalog", icon: "📋", title: "Каталог и услуги", hint: "Список услуг или товаров с ценами" },
  { id: "lead", icon: "✉️", title: "Форма заявки", hint: "Заявки приходят вам в Telegram" },
  { id: "booking", icon: "📅", title: "Онлайн-запись", hint: "Клиент сам выбирает день и время" },
  { id: "gallery", icon: "🖼", title: "Галерея работ", hint: "Фото до и после, портфолио, интерьер" },
  { id: "reviews", icon: "⭐", title: "Отзывы", hint: "Живые отзывы клиентов" },
  { id: "contacts", icon: "📍", title: "Карта и контакты", hint: "Адрес, часы работы, как доехать" },
  { id: "faq", icon: "❓", title: "Частые вопросы", hint: "Снимает большую часть однотипных вопросов" },
  { id: "blog", icon: "📰", title: "Блог и новости", hint: "Статьи и акции, чтобы вас находили в поиске" },
  { id: "tgbot", icon: "🤖", title: "Telegram-бот", hint: "Отвечает и принимает заявки без вас" },
  { id: "aichat", icon: "💬", title: "ИИ-чат на сайте", hint: "Такой же, как этот" },
  { id: "i18n", icon: "🌍", title: "Вторая языковая версия", hint: "Например русская и английская" },
];

export const MODULE_IDS = MODULES.map((m) => m.id);

export type SiteType = "ad" | "card" | "multi" | "shop" | "portal" | "schedule" | "bot";

export const SITE_TYPES: { id: SiteType; title: string }[] = [
  { id: "ad", title: "Рекламный сайт (лендинг)" },
  { id: "card", title: "Сайт-визитка" },
  { id: "multi", title: "Многостраничный сайт" },
  { id: "shop", title: "Интернет-магазин" },
  { id: "portal", title: "Портал" },
  { id: "schedule", title: "Расписание для учёбы" },
  { id: "bot", title: "Telegram-бот" },
];

export interface Brief {
  /** Название бизнеса: «Лохматый Стиль». */
  businessName: string;
  /** Чем занимается: «груминг собак». */
  businessType: string;
  /** Как назвать будущий сайт. */
  siteName: string;
  siteType: SiteType | "";
  modules: ModuleId[];
  phone: string;
  email: string;
  telegram: string;
}

export const EMPTY_BRIEF: Brief = {
  businessName: "",
  businessType: "",
  siteName: "",
  siteType: "",
  modules: [],
  phone: "",
  email: "",
  telegram: "",
};

/* --- Телефон --- */

/** Оставляем только цифры и приводим ведущую 8 к 7. */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("8")) return `7${digits.slice(1)}`;
  return digits;
}

/**
 * Форматируем как +7 (999) 123-45-67 и жёстко режем до 11 цифр,
 * чтобы нельзя было ввести бесконечную череду девяток.
 */
export function formatPhone(value: string): string {
  let digits = phoneDigits(value).slice(0, 11);
  if (!digits) return "";
  if (!digits.startsWith("7")) digits = `7${digits}`.slice(0, 11);

  // Скобку и дефисы добавляем, только когда за ними уже есть цифры. Иначе Backspace
  // стирает «)», маска тут же дописывает её обратно, и номер невозможно стереть.
  const rest = digits.slice(1);
  let out = "+7";
  if (rest.length) out += ` (${rest.slice(0, 3)}`;
  if (rest.length > 3) out += `) ${rest.slice(3, 6)}`;
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`;
  return out;
}

/** Российский номер: 11 цифр, начинается с 7, код оператора не начинается с 0 или 1. */
export function isValidPhone(value: string): boolean {
  const digits = phoneDigits(value);
  if (digits.length !== 11 || !digits.startsWith("7")) return false;

  const operator = digits.slice(1, 4);
  if (/^[01]/.test(operator)) return false;

  // Отсекаем явную ерунду вида 999 999-99-99: все цифры номера одинаковые.
  if (/^(\d)\1{9}$/.test(digits.slice(1))) return false;

  return true;
}

export function phoneError(value: string): string {
  if (!value.trim()) return "Без телефона я не смогу с вами связаться";
  const digits = phoneDigits(value);
  if (digits.length < 11) return "В номере не хватает цифр";
  if (!isValidPhone(value)) return "Проверьте номер — похоже, он введён с ошибкой";
  return "";
}

/* --- Остальные поля --- */

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return true; // почта необязательна
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Приводим к виду @ник, вырезая ссылки вида t.me/ник. */
export function normalizeTelegram(value: string): string {
  const cleaned = value.trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "").replace(/^@/, "");
  return cleaned ? `@${cleaned.replace(/[^A-Za-z0-9_]/g, "")}` : "";
}

export function isValidTelegram(value: string): boolean {
  if (!value.trim()) return true; // телеграм желателен, но не обязателен
  return /^@[A-Za-z0-9_]{4,32}$/.test(normalizeTelegram(value));
}

/** Заполненность заявки — для полоски прогресса. */
export function briefProgress(brief: Brief): number {
  const filled = [
    brief.businessName,
    brief.businessType,
    brief.siteName,
    brief.siteType,
    brief.modules.length ? "да" : "",
    isValidPhone(brief.phone) ? "да" : "",
    brief.telegram,
  ].filter((value) => value.trim().length > 0).length;

  return Math.round((filled / 7) * 100);
}

/** Минимум для отправки: чем занимается, что за бизнес и рабочий телефон. */
export function canSubmit(brief: Brief): boolean {
  return (
    brief.businessType.trim().length > 1 &&
    brief.businessName.trim().length > 0 &&
    isValidPhone(brief.phone) &&
    isValidEmail(brief.email) &&
    isValidTelegram(brief.telegram)
  );
}

export function moduleById(id: string): ModuleInfo | undefined {
  return MODULES.find((m) => m.id === id);
}
