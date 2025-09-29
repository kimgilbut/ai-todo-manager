/**
 * Supabase 데이터베이스 타입 정의
 * PRD 5. 데이터 구조를 기반으로 정의
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          /** 사용자 고유 ID (Supabase Auth UUID) */
          id: string
          /** 사용자 이메일 주소 */
          email: string
          /** 사용자 표시 이름 */
          name: string | null
          /** 프로필 이미지 URL */
          avatar_url: string | null
          /** 계정 생성일시 */
          created_at: string
          /** 마지막 업데이트 시간 */
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          /** 할 일 고유 ID */
          id: string
          /** 사용자 ID (외래키) */
          user_id: string
          /** 할 일 제목 */
          title: string
          /** 할 일 상세 설명 (선택사항) */
          description: string | null
          /** 마감일 (선택사항) */
          due_date: string | null
          /** 할 일 상태 - 진행 중 또는 완료 */
          status: Database['public']['Enums']['todo_status']
          /** 우선순위 (1: 높음, 2: 보통, 3: 낮음) */
          priority: number
          /** 생성일시 */
          created_at: string
          /** 수정일시 */
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          status?: Database['public']['Enums']['todo_status']
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          status?: Database['public']['Enums']['todo_status']
          priority?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_todo_stats: {
        Row: {
          /** 사용자 ID */
          user_id: string
          /** 전체 할 일 개수 */
          total_todos: number
          /** 완료된 할 일 개수 */
          completed_todos: number
          /** 진행 중인 할 일 개수 */
          pending_todos: number
          /** 지연된 할 일 개수 */
          overdue_todos: number
          /** 완료율 (퍼센트) */
          completion_rate: number
        }
        Insert: {
          [_ in never]: never
        }
        Update: {
          [_ in never]: never
        }
      }
    }
    Views: {
      user_todo_stats: {
        Row: {
          user_id: string
          total_todos: number
          completed_todos: number
          pending_todos: number
          overdue_todos: number
          completion_rate: number
        }
        Relationships: [
          {
            foreignKeyName: "user_todo_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      todo_status: 'pending' | 'completed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
