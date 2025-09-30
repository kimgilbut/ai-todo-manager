"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CheckCircle, Mail, Lock, Brain, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { PublicRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"

// 회원가입 폼 검증 스키마 정의
const signupSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 최소 2자 이상이어야 합니다.")
    .max(50, "이름은 50자를 초과할 수 없습니다.")
    .regex(/^[가-힣a-zA-Z\s]+$/, "이름은 한글, 영문, 공백만 사용할 수 있습니다."),
  email: z
    .string()
    .min(1, "이메일을 입력해주세요.")
    .email("유효한 이메일 주소를 입력해주세요."),
  password: z
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
    .max(100, "비밀번호는 100자를 초과할 수 없습니다.")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다."),
  confirmPassword: z
    .string()
    .min(1, "비밀번호 확인을 입력해주세요."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

/**
 * 회원가입 페이지 컴포넌트
 * 사용자 정보를 입력받아 새 계정을 생성하며 AI 기반 할 일 관리 서비스 가입 처리
 */
function SignupPageContent() {
  // 인증 컨텍스트에서 회원가입 함수 가져오기
  const { signUp } = useAuth()
  
  // Next.js 라우터 훅 - 페이지 이동을 위해 사용
  const router = useRouter()

  // React Hook Form과 Zod 검증을 위한 폼 설정
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  // 회원가입 폼 제출 처리 함수
  const onSubmit = async (data: SignupFormData) => {
    try {
      console.log("회원가입 시도:", { email: data.email, name: data.name })
      
      // 인증 컨텍스트의 signUp 함수 사용
      await signUp(data.email, data.password, data.name)
      
      // 성공 시 자동으로 메인 페이지로 리다이렉트됨 (AuthContext에서 처리)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (error) {
      console.error("회원가입 처리 중 오류:", error)
      toast.error(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 서비스 로고 및 소개 섹션 */}
        <div className="text-center space-y-6">
          {/* 로고 영역 */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          
          {/* 서비스 제목 및 설명 */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              AI 할 일 관리 서비스
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              AI 기반 지능형 할 일 관리로<br />
              생산성을 한 단계 높여보세요
            </p>
          </div>

          {/* 핵심 기능 미리보기 */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>AI 자동 분석</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <span>스마트 요약</span>
            </div>
          </div>
        </div>

        {/* 회원가입 폼 카드 */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              회원가입
            </CardTitle>
            <CardDescription className="text-center">
              새 계정을 생성하여 AI 할 일 관리 서비스를 시작하세요
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* 이름 입력 필드 */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        이름
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="홍길동"
                          autoComplete="name"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 이메일 입력 필드 */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        이메일
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@email.com"
                          autoComplete="email"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 비밀번호 입력 필드 */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        비밀번호
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="영문 대소문자, 숫자 포함 8자 이상"
                          autoComplete="new-password"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 비밀번호 확인 입력 필드 */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        비밀번호 확인
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="비밀번호를 다시 입력하세요"
                          autoComplete="new-password"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 회원가입 버튼 */}
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium"
                  disabled={form.formState.isSubmitting || !form.formState.isValid}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      계정 생성 중...
                    </>
                  ) : (
                    "계정 생성"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          {/* 로그인 링크 */}
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?
            </div>
            <Button 
              variant="outline" 
              className="w-full h-11 text-base font-medium"
              disabled={form.formState.isSubmitting}
              asChild
            >
              <Link href="/login">
                로그인
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* 하단 링크 및 정보 */}
        <div className="text-center space-y-4">
          <div className="text-xs text-muted-foreground leading-relaxed">
            회원가입 시{" "}
            <Link href="/terms" className="text-primary hover:underline">
              이용약관
            </Link>
            {" "}및{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              이용약관
            </Link>
            <Link 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </Link>
            <Link 
              href="/support" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              고객지원
            </Link>
          </div>
          
          <p className="text-xs text-muted-foreground">
            © 2025 AI 할 일 관리 서비스. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * 공개 회원가입 페이지 컴포넌트
 * 비로그인 사용자만 접근 가능
 */
export default function SignupPage() {
  return (
    <PublicRoute>
      <SignupPageContent />
    </PublicRoute>
  )
}
