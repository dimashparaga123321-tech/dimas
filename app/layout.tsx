import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Дима Шпарага — сайты и Telegram-боты",
  description: "Сайты и Telegram-боты для бизнеса: ясно, быстро и с характером.",
  openGraph: {
    title: "Дима Шпарага — сайты и Telegram-боты",
    description: "Сайты и Telegram-боты для бизнеса: ясно, быстро и с характером.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Дима Шпарага — сайты и Telegram-боты",
    description: "Сайты и Telegram-боты для бизнеса: ясно, быстро и с характером.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
