/**
 * Supabase 클라이언트 및 타입 통합 export
 * 다른 파일에서 쉽게 import할 수 있도록 중앙화
 */

// 클라이언트 함수들
export { createClient as createServerClient } from './server'
export { createClient as createBrowserClient } from './client'

// 타입 정의
import type { Database } from './types'
export type { Database } from './types'

// 편의를 위한 타입 별칭
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// 자주 사용할 타입들
export type User = Tables<'users'>
export type Todo = Tables<'todos'>
export type TodoInsert = TablesInsert<'todos'>
export type TodoUpdate = TablesUpdate<'todos'>
