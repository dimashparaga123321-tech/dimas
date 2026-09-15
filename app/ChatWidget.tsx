"use client";

import { useEffect, useRef, useState } from "react";
import {
  EMPTY_BRIEF,
  MODULES,
  SITE_TYPES,
  briefProgress,
  canSubmit,
  formatPhone,
  isValidEmail,
  isValidTelegram,
  normalizeTelegram,
  phoneError,
  type Brief,
  type ModuleId,
  type SiteType,
} from "./brief";
import { BOT_URL, isLinkTrouble, requestNewLink, saveLead } from "./botLink";

type Mode = "start" | "brief" | "ask";

interface Message {
  role: "user" | "assistant";
  content: string;
  /** Кнопка-ссылка на чат с Димой в Telegram под сообщением. */
  link?: string;
}

/** Шаги заявки. Каждый — один вопрос и один вид ответа. */
type StepId = "businessName" | "businessType" | "siteType" | "siteName" | "modules" | "phone" | "telegram" | "email" | "done";

const STEPS: { id: StepId; question: string }[] = [
  { id: "businessName", question: "Как называется ваш бизнес?" },
  { id: "businessType", question: "Чем вы занимаетесь? Пары слов хватит — например «груминг собак» или «доставка пиццы»." },
  { id: "siteType", question: "Какой сайт нужен?" },
  { id: "siteName", question: "Как назовём сайт? Можно так же, как бизнес — тогда просто повторите название." },
  { id: "modules", question: "Что должно быть на сайте? Я отметил то, что обычно нужно — снимите лишнее или добавьте своё." },
  { id: "phone", question: "Ваш номер телефона — по нему я свяжусь." },
  { id: "telegram", question: "Ник в Telegram, если есть. Так удобнее всего переписываться." },
  { id: "email", question: "И почта, если хотите. Это необязательно." },
  { id: "done", question: "" },
];

/** Когда сервер недоступен: на статичном хостинге отвечать и принимать заявки некому. */
const OFFLINE_REPLY =
  "Сейчас я не могу ответить — связь с сервером пропала. Попробуйте чуть позже или сразу оставьте заявку: Дима свяжется с вами сам.";

const OFFLINE_SEND_ERROR = "Заявка не отправилась — попробуйте ещё раз через минуту.";

const ASK_GREETING =
  "Спрашивайте. Расскажу, что можно сделать для вашего бизнеса, чем сайт отличается от бота и как мы будем работать.";

/** Через сколько сами предлагаем помощь, если человек читает страницу. */
const AUTO_OPEN_DELAY_MS = 60_000;

const OFFER_KEY = "webbots-chat-offered";

/** Предлагали ли уже помощь в этом визите. sessionStorage может быть запрещён — тогда молчим. */
function wasOffered(): boolean {
  try {
    return sessionStorage.getItem(OFFER_KEY) === "1";
  } catch {
    return true;
  }
}

function markOffered(): void {
  try {
    sessionStorage.setItem(OFFER_KEY, "1");
  } catch {
    // Приватный режим — просто не запомним, ничего страшного.
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("start");
  const [messages, setMessages] = useState<Message[]>([]);
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [chatLink, setChatLink] = useState("");
  const [teaser, setTeaser] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIndex];

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, stepIndex, mode, sendError, sent]);

  useEffect(() => {
    if (open && mode !== "start") inputRef.current?.focus();
  }, [open, mode, stepIndex]);

  // Закрытие по Esc — привычно и не требует целиться в крестик.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Через минуту на странице сами предлагаем помощь — один раз за визит.
  // На телефоне панель закрыла бы весь экран, поэтому там только подсказка у кнопки.
  useEffect(() => {
    if (open || wasOffered()) return;

    const timer = window.setTimeout(() => {
      markOffered();
      if (window.matchMedia("(max-width: 520px)").matches) setTeaser(true);
      else setOpen(true);
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [open]);

  // Кнопка «Давай обсудим идею» на первом экране открывает чат сразу.
  // Ссылка на Telegram в ней остаётся запасной — на случай, если скрипты не загрузились.
  useEffect(() => {
    const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-open-chat]"));
    const onTriggerClick = (event: Event) => {
      event.preventDefault();
      markOffered();
      setTeaser(false);
      setOpen(true);
    };
    triggers.forEach((trigger) => trigger.addEventListener("click", onTriggerClick));
    return () => triggers.forEach((trigger) => trigger.removeEventListener("click", onTriggerClick));
  }, []);

  function toggleOpen() {
    markOffered(); // открыли сами — больше не навязываемся
    setTeaser(false);
    setOpen((value) => !value);
  }

  function openFromTeaser() {
    markOffered();
    setTeaser(false);
    setOpen(true);
  }

  function say(role: Message["role"], content: string, link?: string) {
    setMessages((current) => [...current, { role, content, link }]);
  }

  function startBrief() {
    setMode("brief");
    setStepIndex(0);
    setMessages([{ role: "assistant", content: STEPS[0].question }]);
  }

  function startAsk() {
    setMode("ask");
    setMessages([{ role: "assistant", content: ASK_GREETING }]);
  }

  /** После заявки: переходим к помощнику, который выдаёт новую ссылку на Telegram. */
  function openLinkHelp() {
    setMode("ask");
    setMessages([
      {
        role: "assistant",
        content: "Если ссылка на Telegram не открылась или потерялась — напишите «ссылка не работает», и я пришлю новую. Можно и просто задать вопрос.",
      },
    ]);
  }

  function backToStart() {
    setMode("start");
    setMessages([]);
    setInput("");
    setFieldError("");
    setSendError("");
  }

  /** Переход к следующему шагу с репликой бота. */
  function advance(from: number, extra?: string) {
    const next = from + 1;
    setStepIndex(next);
    setInput("");
    setFieldError("");

    const question = STEPS[next]?.question;
    const lines = [extra, question].filter(Boolean) as string[];
    if (lines.length) say("assistant", lines.join("\n\n"));
  }

  /** Подсказываем модули по сфере — тем же справочником, что и на сервере. */
  async function suggestForBusiness(text: string) {
    setThinking(true);
    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as { modules?: ModuleId[]; siteType?: SiteType };
      if (data.modules?.length) {
        setBrief((current) => ({
          ...current,
          modules: [...new Set([...current.modules, ...(data.modules ?? [])])],
          siteType: current.siteType || data.siteType || "",
        }));
      }
    } catch {
      // Подсказка не критична: клиент выберет модули сам.
    } finally {
      setThinking(false);
    }
  }

  function submitStep() {
    const value = input.trim();

    if (step.id === "businessName") {
      if (value.length < 2) return setFieldError("Напишите название");
      setBrief({ ...brief, businessName: value });
      say("user", value);
      return advance(stepIndex);
    }

    if (step.id === "businessType") {
      if (value.length < 3) return setFieldError("Пары слов хватит, но пусть они будут");
      setBrief({ ...brief, businessType: value });
      say("user", value);
      void suggestForBusiness(value);
      return advance(stepIndex);
    }

    if (step.id === "siteName") {
      if (value.length < 2) return setFieldError("Напишите название");
      setBrief({ ...brief, siteName: value });
      say("user", value);
      return advance(stepIndex);
    }

    if (step.id === "phone") {
      const error = phoneError(value);
      if (error) return setFieldError(error);
      setBrief({ ...brief, phone: formatPhone(value) });
      say("user", formatPhone(value));
      return advance(stepIndex);
    }

    if (step.id === "telegram") {
      if (value && !isValidTelegram(value)) return setFieldError("Ник выглядит странно. Например: @username");
      const nick = value ? normalizeTelegram(value) : "";
      setBrief({ ...brief, telegram: nick });
      say("user", nick || "— пропущу");
      return advance(stepIndex);
    }

    if (step.id === "email") {
      if (value && !isValidEmail(value)) return setFieldError("Проверьте адрес почты");
      setBrief({ ...brief, email: value });
      say("user", value || "— пропущу");
      return advance(stepIndex, "Готово. Проверьте заявку ниже и отправляйте.");
    }
  }

  function skipStep() {
    say("user", "— пропущу");
    if (step.id === "email") return advance(stepIndex, "Готово. Проверьте заявку ниже и отправляйте.");
    advance(stepIndex);
  }

  function chooseSiteType(id: SiteType) {
    const title = SITE_TYPES.find((t) => t.id === id)?.title ?? "";
    setBrief({ ...brief, siteType: id });
    say("user", title);
    advance(stepIndex);
  }

  function toggleModule(id: ModuleId) {
    setBrief((current) => ({
      ...current,
      modules: current.modules.includes(id)
        ? current.modules.filter((m) => m !== id)
        : [...current.modules, id],
    }));
  }

  function confirmModules() {
    const titles = brief.modules
      .map((id) => MODULES.find((m) => m.id === id)?.title)
      .filter(Boolean)
      .join(", ");
    say("user", titles || "пока не знаю");
    advance(stepIndex);
  }

  async function ask(text: string) {
    const content = text.trim();
    if (!content || thinking) return;

    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setThinking(true);

    // «Ссылка не работает» решаем сами, без модели: выдаём новую ссылку на бота.
    if (isLinkTrouble(content)) {
      const result = await requestNewLink();
      if (result.ok) {
        setChatLink(result.link);
        say("assistant", "Вот новая ссылка на чат с Димой в Telegram. Старая больше не работает, а эта сработает один раз.", result.link);
        setThinking(false);
        return;
      }
      if (result.reason !== "offline") {
        say(
          "assistant",
          "Не нашёл вашей заявки в этом браузере — возможно, её отправляли с другого устройства. Оставьте заявку ещё раз: ссылка на чат с Димой появится сразу после отправки."
        );
        setThinking(false);
        return;
      }
      // Бот недоступен — пусть ответит обычный помощник.
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await response.json()) as { ok?: boolean; reply?: string };
      say("assistant", data.reply || OFFLINE_REPLY);
    } catch {
      // На статичном хостинге (GitHub Pages) отвечать некому — честно зовём в Telegram.
      say("assistant", OFFLINE_REPLY);
    } finally {
      setThinking(false);
    }
  }

  async function submitBrief() {
    if (!canSubmit(brief) || sending) return;
    setSending(true);
    setSendError("");

    try {
      // Заявку принимает Telegram-бот: он передаёт её Диме и выдаёт одноразовую ссылку на чат.
      const response = await fetch(`${BOT_URL}/lead`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        leadId?: string;
        secret?: string;
        link?: string;
      } | null;
      if (!data) throw new Error(OFFLINE_SEND_ERROR);
      if (!data.ok) throw new Error(data.error || OFFLINE_SEND_ERROR);
      if (data.leadId && data.secret) saveLead({ leadId: data.leadId, secret: data.secret });
      setChatLink(data.link ?? "");
      setSent(true);
    } catch (caught) {
      setSendError(caught instanceof Error ? caught.message : OFFLINE_SEND_ERROR);
    } finally {
      setSending(false);
    }
  }

  const progress = briefProgress(brief);
  const onDone = mode === "brief" && step.id === "done";

  return (
    <>
      {teaser && !open && (
        <div className="widget-teaser" role="status">
          <button type="button" className="widget-teaser-body" onClick={openFromTeaser}>
            Помогу собрать заявку или отвечу на вопрос о сайте.
          </button>
          <button
            type="button"
            className="widget-teaser-close"
            onClick={() => setTeaser(false)}
            aria-label="Скрыть подсказку"
          >
            ✕
          </button>
        </div>
      )}

      <button
        type="button"
        className={`widget-fab${open ? " is-open" : ""}`}
        onClick={toggleOpen}
        aria-label={open ? "Закрыть чат" : "Открыть чат"}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-5.2A8.5 8.5 0 1 1 21 11.5z" />
          )}
        </svg>
      </button>

      <div className={`widget-panel${open ? " is-open" : ""}`} role="dialog" aria-label="Чат с Web&Bots">
        <header className="widget-head">
          {mode !== "start" && !sent && (
            <button type="button" className="widget-back" onClick={backToStart} aria-label="Назад">
              ←
            </button>
          )}
          <div className="widget-title">
            <strong>Web&amp;Bots</strong>
            <span>{mode === "brief" ? "Заявка на проект" : mode === "ask" ? "Вопрос — ответ" : "Заявка или вопрос"}</span>
          </div>
          <button type="button" className="widget-close" onClick={() => setOpen(false)} aria-label="Закрыть">
            ✕
          </button>
        </header>

        {mode === "brief" && !sent && (
          <div className="widget-progress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="widget-feed" ref={feedRef}>
          {mode === "start" && (
            <div className="widget-start">
              <p className="widget-hello">
                Привет! Я помощник Димы. Помогу собрать заявку на сайт или отвечу на вопросы.
              </p>
              <button type="button" className="widget-choice widget-choice-main" onClick={startBrief}>
                <b>Рассказать о проекте</b>
                <span>Пара минут — и заявка у Димы</span>
              </button>
              <button type="button" className="widget-choice" onClick={startAsk}>
                <b>Просто спросить</b>
                <span>Что можно сделать, сколько занимает, с чего начать</span>
              </button>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`widget-bubble widget-bubble-${message.role}`}>
              {message.content.split("\n").map((line, lineIndex) =>
                line ? <p key={lineIndex}>{line}</p> : <br key={lineIndex} />
              )}
              {message.link && (
                <a className="widget-send widget-tg-link" href={message.link} target="_blank" rel="noopener noreferrer">
                  Открыть чат в Telegram
                </a>
              )}
            </div>
          ))}

          {thinking && (
            <div className="widget-bubble widget-bubble-assistant widget-typing">
              <span />
              <span />
              <span />
            </div>
          )}

          {mode === "brief" && step.id === "siteType" && (
            <div className="widget-chips">
              {SITE_TYPES.map((type) => (
                <button key={type.id} type="button" onClick={() => chooseSiteType(type.id)}>
                  {type.title}
                </button>
              ))}
            </div>
          )}

          {mode === "brief" && step.id === "modules" && (
            <>
              <div className="widget-chips widget-chips-modules">
                {MODULES.map((module) => (
                  <button
                    key={module.id}
                    type="button"
                    className={brief.modules.includes(module.id) ? "is-on" : ""}
                    onClick={() => toggleModule(module.id)}
                    title={module.hint}
                  >
                    <b>{module.icon}</b> {module.title}
                  </button>
                ))}
              </div>
              <button type="button" className="widget-next" onClick={confirmModules}>
                Дальше
              </button>
            </>
          )}

          {onDone && !sent && (
            <div className="widget-summary">
              <h3>Заявка</h3>
              <dl>
                <div><dt>Бизнес</dt><dd>{brief.businessName || "—"}</dd></div>
                <div><dt>Чем занимается</dt><dd>{brief.businessType || "—"}</dd></div>
                <div><dt>Сайт</dt><dd>{brief.siteName || "—"}</dd></div>
                <div><dt>Тип</dt><dd>{SITE_TYPES.find((t) => t.id === brief.siteType)?.title || "—"}</dd></div>
                <div><dt>Телефон</dt><dd>{brief.phone || "—"}</dd></div>
                {brief.telegram && <div><dt>Telegram</dt><dd>{brief.telegram}</dd></div>}
                {brief.email && <div><dt>Почта</dt><dd>{brief.email}</dd></div>}
              </dl>
              <p className="widget-summary-modules">
                {brief.modules.map((id) => MODULES.find((m) => m.id === id)?.title).filter(Boolean).join(" · ") ||
                  "Модули не выбраны"}
              </p>
              <button type="button" className="widget-send" onClick={submitBrief} disabled={sending}>
                {sending ? "Отправляю…" : "Отправить заявку"}
              </button>
              {sendError && <p className="widget-error">{sendError}</p>}
            </div>
          )}

          {sent && mode === "brief" && (
            <div className="widget-sent">
              <b>Заявка у Димы</b>
              {chatLink ? (
                <>
                  <p>Откройте чат с Димой в Telegram — там он вам и ответит. Саму заявку вы там не увидите, она ушла только ему.</p>
                  <a className="widget-send widget-tg-link" href={chatLink} target="_blank" rel="noopener noreferrer">
                    Открыть чат в Telegram
                  </a>
                  <p>Ссылка срабатывает один раз.</p>
                  <button type="button" className="widget-skip" onClick={openLinkHelp}>
                    Ссылка не открылась или потерялась?
                  </button>
                </>
              ) : (
                <p>Дима свяжется с вами по телефону {brief.phone} и назовёт стоимость.</p>
              )}
            </div>
          )}
        </div>

        {((mode === "brief" && !onDone && step.id !== "siteType" && step.id !== "modules") || mode === "ask") && (
          <form
            className="widget-input"
            onSubmit={(event) => {
              event.preventDefault();
              if (mode === "ask") ask(input);
              else submitStep();
            }}
          >
            {mode === "ask" && (
              <button type="button" className="widget-ask-lead" onClick={startBrief}>
                Оставить заявку →
              </button>
            )}
            {fieldError && <p className="widget-field-error">{fieldError}</p>}
            <div className="widget-input-row">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => {
                  setFieldError("");
                  setInput(step?.id === "phone" && mode === "brief" ? formatPhone(event.target.value) : event.target.value);
                }}
                placeholder={
                  mode === "ask"
                    ? "Ваш вопрос"
                    : step.id === "phone"
                      ? "+7 (999) 123-45-67"
                      : step.id === "telegram"
                        ? "@ник"
                        : step.id === "email"
                          ? "почта@пример.ру"
                          : "Ваш ответ"
                }
                inputMode={step?.id === "phone" && mode === "brief" ? "tel" : "text"}
                maxLength={mode === "ask" ? 600 : 120}
                aria-label="Ответ"
              />
              <button type="submit" disabled={thinking} aria-label="Отправить">
                ↑
              </button>
            </div>
            {mode === "brief" && (step.id === "telegram" || step.id === "email") && (
              <button type="button" className="widget-skip" onClick={skipStep}>
                Пропустить
              </button>
            )}
          </form>
        )}
      </div>
    </>
  );
}
