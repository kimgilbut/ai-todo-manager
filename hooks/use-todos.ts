"use client"

import * as React from "react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/auth-context"
import { type Todo, type TodoFormData, type TodoFilter } from "@/components/todo/types"

/**
 * 할 일 관리를 위한 커스텀 훅
 * API 호출, 상태 관리, 에러 처리를 담당
 */
export function useTodos() {
  const { user } = useAuth()
  
  // 상태 관리
  const [todos, setTodos] = React.useState<Todo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<TodoFilter>({
    status: 'all',
    priority: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })


  /**
   * API 요청 헬퍼 함수
   */
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 할 일 목록 조회
   */
  const fetchTodos = React.useCallback(async (currentFilter = filter) => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams()
      if (currentFilter.search) params.append('search', currentFilter.search)
      if (currentFilter.status && currentFilter.status !== 'all') {
        params.append('status', currentFilter.status)
      }
      if (currentFilter.priority && currentFilter.priority !== 'all') {
        params.append('priority', currentFilter.priority.toString())
      }
      if (currentFilter.sortBy) params.append('sortBy', currentFilter.sortBy)
      if (currentFilter.sortOrder) params.append('sortOrder', currentFilter.sortOrder)

      // 디버깅 로그
      console.log('useTodos - 현재 필터:', currentFilter)
      console.log('useTodos - API 요청 URL:', `/api/todos?${params.toString()}`)

      const data = await apiRequest(`/api/todos?${params.toString()}`)
      setTodos(data)
    } catch (error) {
      console.error("할 일 목록 조회 오류:", error)
      toast.error(error instanceof Error ? error.message : "할 일 목록을 불러오는 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [user, filter])

  /**
   * 새 할 일 생성
   */
  const createTodo = async (todoData: TodoFormData): Promise<Todo | null> => {
    try {
      const newTodo = await apiRequest('/api/todos', {
        method: 'POST',
        body: JSON.stringify(todoData),
      })

      // 로컬 상태 업데이트
      setTodos(prev => [newTodo, ...prev])
      toast.success("새 할 일이 생성되었습니다.")
      
      return newTodo
    } catch (error) {
      console.error("할 일 생성 오류:", error)
      toast.error(error instanceof Error ? error.message : "할 일 생성 중 오류가 발생했습니다.")
      return null
    }
  }

  /**
   * 할 일 수정
   */
  const updateTodo = async (todoId: string, updates: Partial<TodoFormData>): Promise<Todo | null> => {
    try {
      const updatedTodo = await apiRequest(`/api/todos/${todoId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      // 로컬 상태 업데이트
      setTodos(prev => 
        prev.map(todo => 
          todo.id === todoId ? updatedTodo : todo
        )
      )
      
      toast.success("할 일이 수정되었습니다.")
      return updatedTodo
    } catch (error) {
      console.error("할 일 수정 오류:", error)
      toast.error(error instanceof Error ? error.message : "할 일 수정 중 오류가 발생했습니다.")
      return null
    }
  }

  /**
   * 할 일 상태 토글 (완료/미완료)
   */
  const toggleTodoStatus = async (todoId: string): Promise<boolean> => {
    const todo = todos.find(t => t.id === todoId)
    if (!todo) return false

    const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
    
    try {
      await updateTodo(todoId, { status: newStatus })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 할 일 삭제
   */
  const deleteTodo = async (todoId: string): Promise<boolean> => {
    try {
      await apiRequest(`/api/todos/${todoId}`, {
        method: 'DELETE',
      })

      // 로컬 상태 업데이트
      setTodos(prev => prev.filter(todo => todo.id !== todoId))
      toast.success("할 일이 삭제되었습니다.")
      
      return true
    } catch (error) {
      console.error("할 일 삭제 오류:", error)
      toast.error(error instanceof Error ? error.message : "할 일 삭제 중 오류가 발생했습니다.")
      return false
    }
  }

  /**
   * 필터 업데이트
   */
  const updateFilter = (newFilter: Partial<TodoFilter>) => {
    const updatedFilter = { ...filter, ...newFilter }
    setFilter(updatedFilter)
    fetchTodos(updatedFilter)
  }

  /**
   * 검색어 업데이트
   */
  const updateSearch = (search: string) => {
    updateFilter({ search })
  }

  /**
   * 상태 필터 업데이트
   */
  const updateStatusFilter = (status: 'pending' | 'completed' | 'all') => {
    updateFilter({ status })
  }

  /**
   * 우선순위 필터 업데이트
   */
  const updatePriorityFilter = (priority: number | 'all') => {
    console.log('우선순위 필터 변경:', priority)
    updateFilter({ priority })
  }

  /**
   * 정렬 업데이트
   */
  const updateSort = (sortBy: 'created_at' | 'due_date' | 'title' | 'priority', sortOrder: 'asc' | 'desc' = 'desc') => {
    updateFilter({ sortBy, sortOrder })
  }

  /**
   * 초기 데이터 로드 및 사용자 변경 시 재로드
   */
  React.useEffect(() => {
    if (user) {
      fetchTodos()
    } else {
      setTodos([])
      setIsLoading(false)
    }
  }, [user, fetchTodos])

  return {
    // 상태
    todos,
    isLoading,
    filter,
    
    // 액션
    createTodo,
    updateTodo,
    toggleTodoStatus,
    deleteTodo,
    refetch: fetchTodos,
    
    // 필터링 및 검색
    updateFilter,
    updateSearch,
    updateStatusFilter,
    updatePriorityFilter,
    updateSort,
    
    // 통계
    stats: {
      total: todos.length,
      completed: todos.filter(t => t.status === 'completed').length,
      pending: todos.filter(t => t.status === 'pending').length,
    }
  }
}
