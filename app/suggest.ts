/**
 * Подбор модулей по ключевым словам.
 *
 * Работает без ИИ: если Workers AI недоступен или ответил мусором, чат
 * всё равно собирает осмысленную заявку. Когда ИИ отвечает — эти же
 * правила подсказывают ему разумную отправную точку.
 */
import type { ModuleId, SiteType } from "./brief";

interface Rule {
  /** Слова, по которым узнаём сферу. Ищем как подстроку, поэтому корни без окончаний. */
  words: string[];
  modules: ModuleId[];
  siteType?: SiteType;
  /** Как назвать сферу в ответе бота. */
  label: string;
}

const RULES: Rule[] = [
  {
    words: ["барбершоп", "парикмахер", "стрижк", "маникюр", "ногт", "салон красот", "космето", "бров", "ресниц", "тату", "массаж", "спа"],
    modules: ["hero", "booking", "catalog", "gallery", "reviews", "contacts"],
    siteType: "ad",
    label: "салон красоты",
  },
  {
    words: ["груминг", "ветеринар", "зоо", "питомц", "собак", "кошк"],
    modules: ["hero", "booking", "catalog", "gallery", "reviews", "contacts"],
    siteType: "ad",
    label: "услуги для животных",
  },
  {
    words: ["кафе", "ресторан", "пицц", "суши", "бар ", "кофейн", "пекарн", "достав", "еда", "кухн", "бургер"],
    modules: ["hero", "catalog", "lead", "gallery", "contacts", "tgbot"],
    siteType: "ad",
    label: "еда и доставка",
  },
  {
    words: ["магазин", "товар", "продаж", "интернет-магаз", "маркетплейс", "одежд", "цвет", "букет"],
    modules: ["hero", "catalog", "lead", "gallery", "reviews", "contacts"],
    siteType: "shop",
    label: "магазин",
  },
  {
    words: ["школ", "курс", "репетитор", "обучен", "универ", "колледж", "кружок", "секц", "уч"],
    modules: ["hero", "catalog", "lead", "faq", "reviews", "contacts"],
    siteType: "schedule",
    label: "обучение",
  },
  {
    words: ["фитнес", "спорт", "трениров", "йог", "танц", "бассейн", "зал"],
    modules: ["hero", "booking", "catalog", "gallery", "reviews", "contacts"],
    siteType: "ad",
    label: "спорт",
  },
  {
    words: ["ремонт", "строит", "мебел", "натяжн", "окн", "плитк", "сантех", "электрик", "клинин", "уборк"],
    modules: ["hero", "catalog", "gallery", "lead", "reviews", "contacts"],
    siteType: "ad",
    label: "ремонт и услуги для дома",
  },
  {
    words: ["автосервис", "шиномонтаж", "автомойк", "машин", "авто", "детейлинг"],
    modules: ["hero", "booking", "catalog", "gallery", "contacts"],
    siteType: "ad",
    label: "авто",
  },
  {
    words: ["фото", "видео", "съёмк", "съемк", "дизайн", "иллюстр", "портфол", "художн", "музык"],
    modules: ["hero", "gallery", "catalog", "lead", "contacts"],
    siteType: "ad",
    label: "творчество и портфолио",
  },
  {
    words: ["юрист", "бухгалт", "консульт", "агентств", "клиник", "врач", "медиц", "стомато"],
    modules: ["hero", "catalog", "lead", "faq", "reviews", "contacts"],
    siteType: "multi",
    label: "услуги и консультации",
  },
];

/** Модули, которые нужны почти всем. Используем, когда сферу не узнали. */
const DEFAULT_MODULES: ModuleId[] = ["hero", "catalog", "lead", "contacts"];

export interface Suggestion {
  modules: ModuleId[];
  siteType?: SiteType;
  label?: string;
}

export function suggestModules(text: string): Suggestion {
  const haystack = text.toLowerCase();
  const matched = RULES.find((rule) => rule.words.some((word) => haystack.includes(word)));

  if (!matched) {
    return { modules: DEFAULT_MODULES };
  }

  return {
    modules: matched.modules,
    siteType: matched.siteType,
    label: matched.label,
  };
}

/** Прямые просьбы клиента: «нужен бот», «хочу отзывы». Добавляем поверх подбора по сфере. */
const EXPLICIT: { words: string[]; module: ModuleId }[] = [
  { words: ["бот", "телеграм", "telegram"], module: "tgbot" },
  { words: ["чат", "ии", "нейросет", "искусственн"], module: "aichat" },
  { words: ["запис", "расписан", "календар", "бронир"], module: "booking" },
  { words: ["отзыв"], module: "reviews" },
  { words: ["галере", "фото работ", "портфол"], module: "gallery" },
  { words: ["блог", "новост", "стать", "seo", "поиск"], module: "blog" },
  { words: ["вопрос", "faq", "чаво"], module: "faq" },
  { words: ["английск", "язык", "перевод"], module: "i18n" },
  { words: ["карт", "адрес", "как доехать"], module: "contacts" },
  { words: ["корзин", "оплат", "купит", "заказ товар"], module: "catalog" },
];

export function explicitModules(text: string): ModuleId[] {
  const haystack = text.toLowerCase();
  return EXPLICIT.filter((entry) => entry.words.some((word) => haystack.includes(word))).map(
    (entry) => entry.module
  );
}
