/**
 * Todo 관련 TypeScript 타입 정의
 * PRD 5.2 todos 테이블 구조를 기반으로 정의
 */

export interface Todo {
  /** 할 일 고유 ID */
  id: string
  /** 사용자 ID */
  user_id: string
  /** 할 일 제목 */
  title: string
  /** 할 일 상세 설명 (선택사항) */
  description?: string
  /** 마감일 (선택사항) */
  due_date?: string
  /** 할 일 상태 - 진행 중 또는 완료 */
  status: 'pending' | 'completed'
  /** 우선순위 (1: 높음, 2: 보통, 3: 낮음) */
  priority?: number
  /** 태그 목록 (선택사항) */
  tags?: string[]
  /** 생성일시 */
  created_at: string
  /** 수정일시 */
  updated_at: string
}

/**
 * 할 일 생성/수정을 위한 폼 데이터 타입
 */
export interface TodoFormData {
  /** 할 일 제목 */
  title: string
  /** 할 일 상세 설명 (선택사항) */
  description?: string
  /** 마감일 (선택사항) */
  due_date?: string
  /** 할 일 상태 (선택사항, 기본값: pending) */
  status?: 'pending' | 'completed'
  /** 우선순위 (1: 높음, 2: 보통, 3: 낮음) */
  priority?: number
  /** 태그 목록 (선택사항) */
  tags?: string[]
}

/**
 * 할 일 필터링 옵션
 */
export interface TodoFilter {
  /** 상태별 필터 */
  status?: 'pending' | 'completed' | 'all'
  /** 우선순위별 필터 */
  priority?: number | 'all'
  /** 검색 키워드 */
  search?: string
  /** 정렬 기준 */
  sortBy?: 'created_at' | 'due_date' | 'title' | 'priority'
  /** 정렬 순서 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * AI 자연어 파싱 응답 타입
 */
export interface AIParsedTodo {
  /** 파싱된 할 일 제목 */
  title: string
  /** 파싱된 상세 설명 */
  description?: string
  /** 파싱된 마감일 */
  due_date?: string
  /** 파싱된 마감 시간 */
  due_time?: string
  /** 파싱된 우선순위 */
  priority?: number
  /** 파싱된 태그 목록 */
  tags?: string[]
  /** 파싱된 상태 */
  status: 'pending' | 'completed'
}

