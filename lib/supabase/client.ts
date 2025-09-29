import { createBrowserClient } from '@supabase/ssr'

/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트 생성 함수
 * 브라우저 환경에서 실행되는 클라이언트 컴포넌트에서 사용
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
