import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Web&Bots — сайты и Telegram-боты",
  description: "Web&Bots создаёт сайты и Telegram-боты для бизнеса: ясно, быстро и с характером.",
  openGraph: {
    title: "Web&Bots — сайты и Telegram-боты",
    description: "Сайты и Telegram-боты для бизнеса: ясно, быстро и с характером.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web&Bots — сайты и Telegram-боты",
    description: "Сайты и Telegram-боты для бизнеса: ясно, быстро и с характером.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
