"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

/**
 * 사용자 프로필 정보 타입
 */
export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

/**
 * 인증 컨텍스트 타입 정의
 */
interface AuthContextType {
  /** 현재 인증된 사용자 (Supabase Auth) */
  user: User | null
  /** 사용자 프로필 정보 (public.users 테이블) */
  profile: UserProfile | null
  /** 인증 상태 로딩 여부 */
  isLoading: boolean
  /** 로그인 함수 */
  signIn: (email: string, password: string) => Promise<void>
  /** 회원가입 함수 */
  signUp: (email: string, password: string, name: string) => Promise<void>
  /** 로그아웃 함수 */
  signOut: () => Promise<void>
  /** 프로필 업데이트 함수 */
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

/**
 * 인증 컨텍스트 생성
 */
const AuthContext = React.createContext<AuthContextType | null>(null)

/**
 * 인증 컨텍스트 사용을 위한 커스텀 훅
 * @returns AuthContextType 인증 컨텍스트 값
 * @throws Provider 없이 사용 시 에러
 */
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서 사용되어야 합니다")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * 인증 상태 관리 프로바이더 컴포넌트
 * 애플리케이션 전체의 인증 상태를 관리하고 제공
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Next.js 라우터 인스턴스
  const router = useRouter()
  
  // Supabase 클라이언트 생성
  const supabase = createClient()

  // 인증 상태 관리
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  /**
   * 사용자 프로필 정보 가져오기
   */
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error("프로필 조회 오류:", error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error("프로필 가져오기 중 오류:", error)
      return null
    }
  }

  /**
   * 로그인 함수
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("로그인 오류:", error)
      
      // 구체적인 오류 메시지 표시
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.")
      } else if (error.message.includes("Email not confirmed")) {
        throw new Error("이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.")
      } else if (error.message.includes("Too many requests")) {
        throw new Error("너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.")
      } else {
        throw new Error("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    }

    if (data.user) {
      const userProfile = await fetchProfile(data.user.id)
      setUser(data.user)
      setProfile(userProfile)
      toast.success("로그인이 완료되었습니다!")
    }
  }

  /**
   * 회원가입 함수
   */
  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    })

    if (error) {
      console.error("회원가입 오류:", error)
      
      // 구체적인 오류 메시지 표시
      if (error.message.includes("User already registered")) {
        throw new Error("이미 가입된 이메일입니다. 로그인을 시도해주세요.")
      } else if (error.message.includes("Password")) {
        throw new Error("비밀번호가 조건에 맞지 않습니다. 다시 확인해주세요.")
      } else if (error.message.includes("Email")) {
        throw new Error("이메일 형식이 올바르지 않습니다.")
      } else {
        throw new Error("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    }

    if (data.user) {
      // 사용자 프로필 테이블에 데이터 삽입 (트리거가 실패할 경우 대비)
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: email,
            name: name,
          }
        ])

      if (profileError && !profileError.message.includes("duplicate")) {
        console.error("프로필 생성 오류:", profileError)
        // 프로필 생성 실패해도 회원가입은 성공한 상태이므로 경고만 표시
        toast.warning("회원가입은 완료되었지만 프로필 설정에서 오류가 발생했습니다.")
      }

      const userProfile = await fetchProfile(data.user.id)
      setUser(data.user)
      setProfile(userProfile)
      toast.success("회원가입이 완료되었습니다!")
    }
  }

  /**
   * 로그아웃 함수
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error("로그아웃 오류:", error)
      toast.error("로그아웃 중 오류가 발생했습니다.")
      return
    }

    setUser(null)
    setProfile(null)
    toast.success("로그아웃되었습니다.")
    router.push('/login')
  }

  /**
   * 프로필 업데이트 함수
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error("로그인이 필요합니다.")
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.error("프로필 업데이트 오류:", error)
      throw new Error("프로필 업데이트 중 오류가 발생했습니다.")
    }

    // 로컬 상태 업데이트
    setProfile(prev => prev ? { ...prev, ...updates } : null)
    toast.success("프로필이 업데이트되었습니다.")
  }

  /**
   * 초기 인증 상태 확인 및 설정
   */
  React.useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).then(setProfile)
      }
      setIsLoading(false)
    })

    // 인증 상태 변경 리스너 설정
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("인증 상태 변경:", event, session?.user?.id)
      
      if (session?.user) {
        setUser(session.user)
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setUser(null)
        setProfile(null)
      }
      setIsLoading(false)
    })

    // 클린업 함수
    return () => subscription.unsubscribe()
  }, [])

  // 컨텍스트 값 제공
  const value = React.useMemo(
    () => ({
      user,
      profile,
      isLoading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, profile, isLoading]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
