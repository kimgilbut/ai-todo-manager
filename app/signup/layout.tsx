import type { Metadata } from "next"

/**
 * 회원가입 페이지 메타데이터
 */
export const metadata: Metadata = {
  title: "회원가입",
  description: "AI 할 일 관리 서비스에 가입하여 AI가 도와주는 똑똑한 업무 관리를 경험해보세요.",
  openGraph: {
    title: "회원가입 | AI 할 일 관리 서비스",
    description: "AI 할 일 관리 서비스에 가입하여 AI가 도와주는 똑똑한 업무 관리를 경험해보세요.",
  },
  twitter: {
    title: "회원가입 | AI 할 일 관리 서비스",
    description: "AI 할 일 관리 서비스에 가입하여 AI가 도와주는 똑똑한 업무 관리를 경험해보세요.",
  },
  robots: {
    index: false, // 회원가입 페이지는 검색 엔진에서 제외
    follow: true,
  },
}

/**
 * 회원가입 페이지 레이아웃
 */
export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
