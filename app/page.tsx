import ChatWidget from "./ChatWidget";

const telegram = "https://t.me/shpdmitriy";

export const dynamic = "force-static";

const steps = [
  ["01", "Разбираемся", "Вы рассказываете о задаче, клиентах и цели. Я собираю понятную структуру."],
  ["02", "Собираем", "Пишу, проектирую и показываю живую версию — без долгих ожиданий."],
  ["03", "Запускаем", "Проверяем детали, публикуем и оставляем вам простой способ всё поддерживать."],
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="top">
        <nav className="nav" aria-label="Навигация">
          <a className="brand-wordmark" href="#top" aria-label="Web and Bots — на главную">Web<span>&amp;</span>Bots</a>
          <div className="nav-links">
            <a href="#services">Услуги</a>
            <a href="#process">Как работаем</a>
          </div>
          <a className="nav-cta" href={telegram}>Написать <b>↗</b></a>
        </nav>

        <div className="hero-grid">
          <p className="hero-note">Дима Шпарага<br />веб‑разработчик · Санкт‑Петербург</p>
          <div className="hero-main">
            <p className="eyebrow">Сайты и Telegram‑боты для бизнеса</p>
            <h1>Собираю<br /><i>цифровые</i><br />истории.</h1>
            <p className="hero-text">Чтобы вас находили, понимали и выбирали — без сложных слов и бесконечной разработки.</p>
            <a className="primary-button" href={telegram} data-open-chat>Давай обсудим идею <span>↗</span></a>
          </div>
          <div className="orbit" aria-hidden="true"><span>01</span><b>◉</b><i /></div>
        </div>
        <p className="hero-foot">Листайте вниз <span>↓</span></p>
      </section>

      <section className="services" id="services">
        <p className="eyebrow">То, что могу сделать</p>
        <h2>От первой<br />мысли — <i>до запуска.</i></h2>
        <div className="service-grid">
          <article><span>01</span><h3>Рекламные сайты для бизнеса</h3><p>Лендинги и многостраничные сайты для малого и большого бизнеса — показывают сильные стороны, вызывают доверие и приводят клиентов к заявке.</p></article>
          <article><span>02</span><h3>Telegram‑боты и ИИ‑чаты</h3><p>Боты отвечают на вопросы, помогают выбрать услугу, принимают заявки и остаются на связи, пока вы заняты работой.</p></article>
          <article><span>03</span><h3>Расписание для учебы</h3><p>Понятные расписания для школ, колледжей, вузов и кружков — чтобы студенты, преподаватели и родители всегда видели актуальные занятия.</p></article>
        </div>
      </section>

      <section className="process" id="process">
        <div className="process-title">
          <p className="eyebrow">Без путаницы и лишних созвонов</p>
          <h2>Спокойно.<br /><i>По шагам.</i></h2>
        </div>
        <div className="steps">
          {steps.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span><h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="proof">
        <div className="proof-stamp" aria-hidden="true">ПОГОВОРИМ<br />О<br />ДЕЛЕ</div>
        <div>
          <p className="eyebrow">Вместо сложного техзадания</p>
          <h2>Нормальный<br />разговор <i>о деле.</i></h2>
          <p className="proof-text">Напишите, чем занимаетесь и что хочется улучшить. Я отвечу простым языком и предложу первый шаг.</p>
          <a className="outline-button" href={telegram}>Открыть Telegram <span>↗</span></a>
        </div>
      </section>

      <footer>
        <a className="brand-wordmark" href="#top">Web<span>&amp;</span>Bots</a>
        <a href={telegram}>@shpdmitriy</a>
        <span>© 2026</span>
      </footer>

      <ChatWidget />
    </main>
  );
}
