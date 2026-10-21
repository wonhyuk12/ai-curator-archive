import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import "./globals.css";

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AI ARCHIVE — 직업별 AI 에이전트 & 툴 아카이브",
  description: "개발자, 디자이너, 공부, 영상 편집. 직업별로 정리한 AI 에이전트 & 툴 아카이브.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${space.variable} ${jetbrains.variable} antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
        {/* 키오스크 위젯: /kiosk 에서 켠 키오스크 모드일 때만 동작 (일반 방문자는 바로 종료) */}
        <Script src="/kiosk/kiosk.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
