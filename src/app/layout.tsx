import type { Metadata } from "next";
import { Nunito_Sans, Varela_Round } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const varela = Varela_Round({
  variable: "--font-varela",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Smile Score", template: "%s · Smile Score" },
  description: "Upload a photo and get a smile score from 0 to 100.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} ${varela.variable} h-full`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-foreground focus:shadow-card"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
