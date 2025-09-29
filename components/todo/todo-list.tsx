"use client"

import * as React from "react"
import { Search, Filter, SortAsc, SortDesc, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TodoCard } from "./todo-card"
import { type Todo, type TodoFilter } from "./types"

interface TodoListProps {
  /** 표시할 할 일 목록 */
  todos: Todo[]
  /** 로딩 상태 */
  isLoading?: boolean
  /** 현재 필터 상태 */
  filter?: TodoFilter
  /** 할 일 상태 변경 핸들러 */
  onStatusChange?: (todoId: string, status: 'pending' | 'completed') => void
  /** 할 일 편집 핸들러 */
  onEdit?: (todo: Todo) => void
  /** 할 일 삭제 핸들러 */
  onDelete?: (todoId: string) => void
  /** 새 할 일 추가 핸들러 */
  onAddNew?: () => void
  /** 검색어 변경 핸들러 */
  onSearchChange?: (search: string) => void
  /** 상태 필터 변경 핸들러 */
  onStatusFilterChange?: (status: 'pending' | 'completed' | 'all') => void
  /** 우선순위 필터 변경 핸들러 */
  onPriorityFilterChange?: (priority: number | 'all') => void
  /** 정렬 변경 핸들러 */
  onSortChange?: (sortBy: 'created_at' | 'due_date' | 'title' | 'priority', sortOrder: 'asc' | 'desc') => void
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 할 일 목록을 표시하고 관리하는 컴포넌트
 * PRD 2.2 검색, 필터, 정렬 기능 포함
 */
export function TodoList({
  todos,
  isLoading = false,
  filter = {
    status: 'all',
    priority: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  },
  onStatusChange,
  onEdit,
  onDelete,
  onAddNew,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSortChange,
  className,
}: TodoListProps) {
  /**
   * 검색어 변경 핸들러 (디바운싱 적용)
   */
  const [localSearch, setLocalSearch] = React.useState(filter.search || '')
  
  // 로컬 검색어와 필터 검색어 동기화
  React.useEffect(() => {
    setLocalSearch(filter.search || '')
  }, [filter.search])

  // 디바운싱된 검색어 변경
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (filter.search || '')) {
        onSearchChange?.(localSearch)
      }
    }, 300) // 300ms 디바운싱

    return () => clearTimeout(timer)
  }, [localSearch, filter.search, onSearchChange])

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
  }

  /**
   * 상태 필터 변경 핸들러
   */
  const handleStatusFilterChange = (status: string) => {
    onStatusFilterChange?.(status as 'pending' | 'completed' | 'all')
  }

  /**
   * 우선순위 필터 변경 핸들러
   */
  const handlePriorityFilterChange = (priority: string) => {
    onPriorityFilterChange?.(priority === 'all' ? 'all' : parseInt(priority))
  }

  /**
   * 정렬 기준 변경 핸들러
   */
  const handleSortChange = (sortBy: 'created_at' | 'due_date' | 'title' | 'priority') => {
    onSortChange?.(sortBy, filter.sortOrder || 'desc')
  }

  /**
   * 정렬 순서 토글 핸들러
   */
  const handleSortOrderToggle = () => {
    const newOrder = filter.sortOrder === 'asc' ? 'desc' : 'asc'
    onSortChange?.(filter.sortBy || 'created_at', newOrder)
  }

  // 필터링과 정렬은 API에서 처리되므로 todos를 그대로 사용
  const displayTodos = todos

  // 통계 계산
  const stats = React.useMemo(() => {
    const total = todos.length
    const completed = todos.filter(todo => todo.status === 'completed').length
    const pending = todos.filter(todo => todo.status === 'pending').length
    
    return { total, completed, pending }
  }, [todos])

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 헤더 - 통계 및 새 할 일 추가 버튼 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">할 일 목록</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>전체 {stats.total}개</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              완료 {stats.completed}개
            </Badge>
            <Badge variant="outline">
              진행중 {stats.pending}개
            </Badge>
          </div>
        </div>
        
        <Button onClick={onAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          새 할 일
        </Button>
      </div>

      {/* 검색 및 필터 섹션 */}
      <div className="space-y-4">
        {/* 검색 바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="할 일 검색..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              // Enter 키로 폼 제출 방지
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
            className="pl-10"
          />
        </div>

        {/* 필터 및 정렬 옵션 */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* 상태 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter.status} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">우선순위:</span>
            <Select 
              value={filter.priority?.toString() || 'all'} 
              onValueChange={handlePriorityFilterChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="1">높음</SelectItem>
                <SelectItem value="2">보통</SelectItem>
                <SelectItem value="3">낮음</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 정렬 기준 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">정렬:</span>
            <Select value={filter.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">생성일</SelectItem>
                <SelectItem value="due_date">마감일</SelectItem>
                <SelectItem value="title">제목</SelectItem>
                <SelectItem value="priority">우선순위</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 정렬 순서 */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleSortOrderToggle}
              className="h-9 w-9"
            >
              {filter.sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              <span className="sr-only">
                {filter.sortOrder === 'asc' ? '오름차순' : '내림차순'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* 할 일 목록 */}
      <div className="space-y-4">
        {displayTodos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground space-y-2">
              <p className="text-lg">
                {filter.search || filter.status !== 'all' || (filter.priority && filter.priority !== 'all')
                  ? '조건에 맞는 할 일이 없습니다' 
                  : '아직 할 일이 없습니다'
                }
              </p>
              <p className="text-sm">
                {!filter.search && filter.status === 'all' && (!filter.priority || filter.priority === 'all') && (
                  '새로운 할 일을 추가해보세요!'
                )}
              </p>
            </div>
          </div>
        ) : (
          displayTodos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

