"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon, Wand2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { type Todo, type TodoFormData } from "./types"

/**
 * 할 일 폼 검증 스키마
 * PRD 5.2 todos 테이블 구조를 기반으로 정의
 */
const todoFormSchema = z.object({
  title: z
    .string()
    .min(1, "할 일 제목을 입력해주세요")
    .max(200, "제목은 200자 이하로 입력해주세요"),
  description: z
    .string()
    .max(1000, "설명은 1000자 이하로 입력해주세요")
    .optional(),
  due_date: z
    .string()
    .optional(),
  status: z
    .enum(['pending', 'completed'])
    .optional()
    .default('pending'),
  priority: z
    .number()
    .min(1, "우선순위는 1-3 사이의 값이어야 합니다")
    .max(3, "우선순위는 1-3 사이의 값이어야 합니다")
    .optional()
    .default(2),
  tags: z
    .array(z.string())
    .max(3, "태그는 최대 3개까지 입력 가능합니다")
    .optional()
    .default([]),
})

interface TodoFormProps {
  /** 편집할 할 일 (새 할 일 생성 시 undefined) */
  initialTodo?: Todo
  /** 폼 제출 핸들러 */
  onSubmit: (data: TodoFormData) => Promise<void> | void
  /** 취소 핸들러 */
  onCancel?: () => void
  /** 로딩 상태 */
  isLoading?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 할 일 추가/편집을 위한 폼 컴포넌트
 * PRD 2.3 AI 기능 - 자연어를 할 일로 변환 기능 포함
 */
export function TodoForm({
  initialTodo,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: TodoFormProps) {
  const [isAIMode, setIsAIMode] = React.useState(false)
  const [aiInput, setAiInput] = React.useState("")
  const [isAILoading, setIsAILoading] = React.useState(false)

  // React Hook Form 설정
  const form = useForm<TodoFormData>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: initialTodo?.title ?? "",
      description: initialTodo?.description ?? "",
      due_date: initialTodo?.due_date ?? "",
      status: initialTodo?.status ?? "pending",
      priority: initialTodo?.priority ?? 2,
      tags: initialTodo?.tags ?? [],
    },
  })

  const isEditing = !!initialTodo

  /**
   * 폼 제출 처리
   */
  const handleSubmit = async (data: TodoFormData) => {
    try {
      console.log('TodoForm - 제출할 데이터:', data)
      await onSubmit(data)
      if (!isEditing) {
        form.reset()
        setAiInput("")
        setIsAIMode(false)
      }
    } catch (error) {
      console.error("할 일 저장 오류:", error)
    }
  }

  /**
   * AI 자연어 파싱 처리
   */
  const handleAIParse = async () => {
    if (!aiInput.trim()) return

    setIsAILoading(true)
    try {
      // AI 파싱 API 호출 (원본 입력 그대로 전달)
      const response = await fetch('/api/ai/parse-todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: aiInput }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI 파싱에 실패했습니다.')
      }

      const parsed = await response.json()
      
      // 파싱된 결과를 폼에 적용
      form.setValue('title', parsed.title)
      if (parsed.description) {
        form.setValue('description', parsed.description)
      }
      if (parsed.due_date) {
        form.setValue('due_date', parsed.due_date)
      }
      if (parsed.due_time) {
        // 시간 정보가 있으면 날짜와 시간을 합쳐서 설정
        const dateTime = `${parsed.due_date}T${parsed.due_time}`
        form.setValue('due_date', dateTime)
      }
      if (parsed.priority) {
        form.setValue('priority', parsed.priority)
      }
      if (parsed.tags && Array.isArray(parsed.tags)) {
        form.setValue('tags', parsed.tags)
      }
      
      // AI 모드 해제하고 일반 폼으로 전환
      setIsAIMode(false)
      setAiInput("")
    } catch (error) {
      console.error("AI 파싱 오류:", error)
      toast.error(error instanceof Error ? error.message : 'AI 파싱 중 오류가 발생했습니다.')
    } finally {
      setIsAILoading(false)
    }
  }

  /**
   * AI 모드 토글 처리
   */
  const handleAIModeToggle = () => {
    setIsAIMode(!isAIMode)
    if (isAIMode) {
      setAiInput("")
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* AI 모드 토글 (새 할 일 추가 시만) */}
      {!isEditing && (
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <label 
              htmlFor="ai-mode" 
              className="text-sm font-medium text-muted-foreground"
            >
              AI 자동 입력
            </label>
            <Switch
              id="ai-mode"
              checked={isAIMode}
              onCheckedChange={handleAIModeToggle}
            />
          </div>
        </div>
      )}

      {/* AI 자연어 입력 모드 */}
      {isAIMode && !isEditing && (
        <div className="space-y-4 p-4 border rounded-lg bg-accent/5">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              자연어로 할 일 입력
            </label>
            <p className="text-xs text-muted-foreground">
              예: &ldquo;내일 오전 10시에 팀 회의 준비&rdquo;, &ldquo;이번 주까지 보고서 작성&rdquo;
            </p>
          </div>
          
          <div className="flex gap-2">
            <Textarea
              placeholder="자연스러운 문장으로 할 일을 입력해주세요..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="flex-1"
              rows={2}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleAIParse}
              disabled={!aiInput.trim() || isAILoading}
              className="gap-2"
            >
              {isAILoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              AI로 변환
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAIModeToggle}
            >
              일반 입력으로 전환
            </Button>
          </div>
        </div>
      )}

      {/* 일반 폼 */}
      {!isAIMode && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 할 일 제목 */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>할 일 제목 *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="할 일을 입력해주세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 할 일 설명 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상세 설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="할 일에 대한 자세한 설명을 입력해주세요 (선택사항)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    필요한 경우 할 일에 대한 추가 정보를 입력하세요
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 마감일 */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>마감일</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "yyyy년 M월 d일 HH:mm", { locale: ko })
                          ) : (
                            "마감일을 선택해주세요"
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // 현재 시간으로 설정
                            const now = new Date()
                            date.setHours(now.getHours(), now.getMinutes())
                            field.onChange(date.toISOString())
                          } else {
                            field.onChange("")
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    선택사항: 할 일을 완료해야 하는 날짜
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 상태 (편집 시만) */}
            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상태</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상태를 선택해주세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">진행중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 우선순위 */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>우선순위</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString() || "2"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="우선순위를 선택해주세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">높음</SelectItem>
                      <SelectItem value="2">보통</SelectItem>
                      <SelectItem value="3">낮음</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    할 일의 우선순위를 설정해주세요
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 태그 */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>태그 (선택사항)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="태그를 쉼표로 구분하여 입력 (예: 업무, 긴급)"
                      value={field.value?.join(', ') || ''}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(',')
                          .map(tag => tag.trim())
                          .filter(tag => tag.length > 0)
                          .slice(0, 3) // 최대 3개
                        field.onChange(tags)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    할 일을 분류할 태그를 입력해주세요 (최대 3개)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 버튼 그룹 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  isEditing ? '수정하기' : '추가하기'
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  취소
                </Button>
              )}
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

