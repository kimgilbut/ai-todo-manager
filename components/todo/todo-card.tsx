"use client"

import * as React from "react"
import { formatDistanceToNow, format, isPast } from "date-fns"
import { ko } from "date-fns/locale"
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Minus
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { type Todo } from "./types"

interface TodoCardProps {
  /** 표시할 할 일 데이터 */
  todo: Todo
  /** 할 일 상태 변경 핸들러 */
  onStatusChange?: (todoId: string, status: 'pending' | 'completed') => void
  /** 할 일 편집 핸들러 */
  onEdit?: (todo: Todo) => void
  /** 할 일 삭제 핸들러 */
  onDelete?: (todoId: string) => void
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 우선순위 정보를 반환하는 유틸리티 함수
 */
const getPriorityInfo = (priority?: number) => {
  switch (priority) {
    case 1:
      return {
        label: '높음',
        icon: ChevronUp,
        className: 'text-red-600 bg-red-50 border-red-200',
        iconClassName: 'text-red-600'
      }
    case 2:
      return {
        label: '보통',
        icon: Minus,
        className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        iconClassName: 'text-yellow-600'
      }
    case 3:
      return {
        label: '낮음',
        icon: ChevronDown,
        className: 'text-green-600 bg-green-50 border-green-200',
        iconClassName: 'text-green-600'
      }
    default:
      return {
        label: '보통',
        icon: Minus,
        className: 'text-gray-600 bg-gray-50 border-gray-200',
        iconClassName: 'text-gray-600'
      }
  }
}

/**
 * 개별 할 일을 표시하는 카드 컴포넌트
 * PRD 3.2 메인 화면의 개별 할 일 편집 및 삭제 기능 구현
 */
export function TodoCard({
  todo,
  onStatusChange,
  onEdit,
  onDelete,
  className,
}: TodoCardProps) {
  // 마감일 관련 상태 계산
  const isOverdue = todo.due_date && isPast(new Date(todo.due_date)) && todo.status === 'pending'
  
  // 우선순위 정보 가져오기
  const priorityInfo = getPriorityInfo(todo.priority)
  
  // 디버깅 로그
  console.log('TodoCard - 할 일 우선순위:', todo.title, '->', todo.priority, '->', priorityInfo)
  
  /**
   * 체크박스 상태 변경 처리
   */
  const handleStatusToggle = (checked: boolean) => {
    const newStatus = checked ? 'completed' : 'pending'
    onStatusChange?.(todo.id, newStatus)
  }

  /**
   * 상대적 시간 표시 (예: "2시간 전", "내일")
   */
  const getRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ko 
    })
  }

  /**
   * 마감일 포맷팅
   */
  const formatDueDate = (date: string) => {
    return format(new Date(date), "M월 d일 HH:mm", { locale: ko })
  }

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      todo.status === 'completed' && "opacity-75 bg-muted/50",
      isOverdue && "border-destructive/50 bg-destructive/5",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* 체크박스와 제목 */}
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={todo.status === 'completed'}
              onCheckedChange={handleStatusToggle}
              className="mt-1"
              aria-label={`${todo.title} 완료 상태 변경`}
            />
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium leading-tight break-words",
                todo.status === 'completed' && "line-through text-muted-foreground"
              )}>
                {todo.title}
              </h3>
              {todo.description && (
                <p className={cn(
                  "text-sm text-muted-foreground mt-1 break-words",
                  todo.status === 'completed' && "line-through"
                )}>
                  {todo.description}
                </p>
              )}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-1">
            {/* 수정 버튼 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0 hover:bg-primary/10"
              onClick={() => onEdit?.(todo)}
              title="수정"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">수정</span>
            </Button>
            
            {/* 삭제 버튼 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete?.(todo.id)}
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">삭제</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-2">
          {/* 마감일 정보 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {todo.due_date && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-destructive"
              )}>
                {isOverdue ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
                <span>{formatDueDate(todo.due_date)}</span>
              </div>
            )}
            
            {/* 생성 시간 */}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{getRelativeTime(todo.created_at)}</span>
            </div>
          </div>

          {/* 상태 및 우선순위 배지 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 우선순위 배지 */}
            <Badge 
              variant="outline"
              className={cn(
                "text-xs flex items-center gap-1",
                priorityInfo.className
              )}
            >
              <priorityInfo.icon className="h-3 w-3" />
              {priorityInfo.label}
            </Badge>
            
            {/* 태그 배지들 */}
            {todo.tags && todo.tags.length > 0 && (
              <>
                {todo.tags.slice(0, 2).map((tag, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {todo.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{todo.tags.length - 2}
                  </Badge>
                )}
              </>
            )}
            
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                지연
              </Badge>
            )}
            <Badge 
              variant={todo.status === 'completed' ? 'secondary' : 'outline'}
              className={cn(
                "text-xs",
                todo.status === 'completed' && "bg-secondary text-secondary-foreground"
              )}
            >
              {todo.status === 'completed' ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  완료
                </>
              ) : (
                <>
                  <Circle className="mr-1 h-3 w-3" />
                  진행중
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

