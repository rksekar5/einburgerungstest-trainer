import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Einbürgerungstest Trainer",
  description: "Adaptiver, zweisprachiger Trainer für den deutschen Einbürgerungstest mit KI-Tutor.",
};

// Applies the saved (or system) theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Zum Inhalt springen / Skip to content
        </a>

        {/* German-flag accent stripe. */}
        <div
          aria-hidden="true"
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(to bottom, #1b1b1f 0 33.33%, #c81e1e 0 66.66%, #e0a800 0)",
          }}
        />

        <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-lg font-semibold tracking-tight"
            >
              <span
                aria-hidden="true"
                className="inline-block h-5 w-5 rounded-md"
                style={{
                  background:
                    "linear-gradient(to bottom, #1b1b1f 0 33.33%, #c81e1e 0 66.66%, #e0a800 0)",
                }}
              />
              <span>Einbürgerungstest</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
