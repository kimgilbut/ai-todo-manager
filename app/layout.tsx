import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI 할 일 관리 서비스",
    template: "%s | AI 할 일 관리 서비스"
  },
  description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
  keywords: ["할 일 관리", "AI", "생산성", "일정 관리", "스마트 요약", "자연어 처리", "업무 효율성"],
  authors: [{ name: "AI Todo Manager Team" }],
  creator: "AI Todo Manager",
  publisher: "AI Todo Manager",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: 'AI 할 일 관리 서비스',
    description: 'AI가 도와주는 똑똑한 할 일 관리 서비스',
    siteName: 'AI 할 일 관리 서비스',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 할 일 관리 서비스',
    description: 'AI가 도와주는 똑똑한 할 일 관리 서비스',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console 인증 시 추가
    // google: 'verification-code',
  },
};

/**
 * 애플리케이션 루트 레이아웃
 * 전역 스타일, 폰트, 토스터, 인증 프로바이더 설정 포함
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
