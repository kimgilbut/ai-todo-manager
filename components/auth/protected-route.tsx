"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

interface ProtectedRouteProps {
  children: React.ReactNode
  /** 로그인하지 않은 사용자가 접근 시 리다이렉트할 경로 */
  redirectTo?: string
  /** 로딩 중 표시할 컴포넌트 */
  fallback?: React.ReactNode
}

/**
 * 보호된 라우트 컴포넌트
 * 로그인한 사용자만 접근할 수 있는 페이지를 보호
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = "/login",
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // 인증 상태 확인 후 리다이렉트 처리
  React.useEffect(() => {
    if (!isLoading && !user) {
      console.log("인증되지 않은 사용자, 로그인 페이지로 리다이렉트")
      router.push(redirectTo)
    }
  }, [user, isLoading, redirectTo, router])

  // 로딩 중이거나 사용자가 없는 경우
  if (isLoading) {
    return fallback || <DefaultLoadingFallback />
  }

  if (!user) {
    return null // 리다이렉트 처리 중
  }

  // 인증된 사용자인 경우 자식 컴포넌트 렌더링
  return <>{children}</>
}

/**
 * 기본 로딩 폴백 컴포넌트
 */
function DefaultLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 스켈레톤 */}
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex flex-col gap-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 스켈레톤 */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="space-y-4">
          <Skeleton className="w-full h-24" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-16" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PublicRouteProps {
  children: React.ReactNode
  /** 로그인한 사용자가 접근 시 리다이렉트할 경로 */
  redirectTo?: string
}

/**
 * 공개 라우트 컴포넌트
 * 로그인하지 않은 사용자만 접근할 수 있는 페이지 (로그인, 회원가입 등)
 */
export function PublicRoute({ 
  children, 
  redirectTo = "/" 
}: PublicRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // 인증 상태 확인 후 리다이렉트 처리
  React.useEffect(() => {
    if (!isLoading && user) {
      console.log("이미 로그인된 사용자, 메인 페이지로 리다이렉트")
      router.push(redirectTo)
    }
  }, [user, isLoading, redirectTo, router])

  // 로딩 중인 경우
  if (isLoading) {
    return <DefaultLoadingFallback />
  }

  // 로그인된 사용자인 경우
  if (user) {
    return null // 리다이렉트 처리 중
  }

  // 비로그인 사용자인 경우 자식 컴포넌트 렌더링
  return <>{children}</>
}
