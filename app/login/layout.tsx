import type { Metadata } from "next"

/**
 * 로그인 페이지 메타데이터
 */
export const metadata: Metadata = {
  title: "로그인",
  description: "AI 할 일 관리 서비스에 로그인하여 스마트한 업무 관리를 시작하세요.",
  openGraph: {
    title: "로그인 | AI 할 일 관리 서비스",
    description: "AI 할 일 관리 서비스에 로그인하여 스마트한 업무 관리를 시작하세요.",
  },
  twitter: {
    title: "로그인 | AI 할 일 관리 서비스",
    description: "AI 할 일 관리 서비스에 로그인하여 스마트한 업무 관리를 시작하세요.",
  },
  robots: {
    index: false, // 로그인 페이지는 검색 엔진에서 제외
    follow: true,
  },
}

/**
 * 로그인 페이지 레이아웃
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
