"use client"

import * as React from "react"

import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { TodoList } from "@/components/todo/todo-list"
import { TodoForm } from "@/components/todo/todo-form"
import { AISummary } from "@/components/ai/ai-summary"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useTodos } from "@/hooks/use-todos"
import { type Todo, type TodoFormData } from "@/components/todo/types"

/**
 * 메인 홈페이지 컴포넌트
 * PRD 3.2 메인 화면 - 할 일 관리, 검색/필터/정렬, AI 요약 기능 구현
 */
function HomePageContent() {
  // 인증 컨텍스트에서 사용자 정보 가져오기
  const { profile, signOut } = useAuth()
  
  // profile이 없으면 currentUser도 undefined
  const currentUser = profile ? {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar_url: profile.avatar_url
  } : undefined
  
  // 할 일 관리 훅
  const {
    todos,
    isLoading,
    filter,
    createTodo,
    updateTodo,
    toggleTodoStatus,
    deleteTodo,
    updateSearch,
    updateStatusFilter,
    updatePriorityFilter,
    updateSort
  } = useTodos()
  
  // 편집 모달 상태
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingTodo, setEditingTodo] = React.useState<Todo | undefined>()
  
  // 삭제 확인 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [todoToDelete, setTodoToDelete] = React.useState<string | null>(null)
  
  // 폼 제출 로딩 상태
  const [isSubmitting, setIsSubmitting] = React.useState(false)


  // 할 일 데이터는 useTodos 훅에서 자동으로 관리됨

  /**
   * 할 일 추가 처리
   */
  const handleAddTodo = async (data: TodoFormData) => {
    setIsSubmitting(true)
    
    try {
      const success = await createTodo(data)
      if (success) {
        setIsFormOpen(false)
        setEditingTodo(undefined)
      }
    } catch (error) {
      console.error("할 일 추가 오류:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 할 일 수정 처리
   */
  const handleEditTodo = async (data: TodoFormData) => {
    if (!editingTodo) return

    setIsSubmitting(true)
    
    try {
      const success = await updateTodo(editingTodo.id, data)
      if (success) {
        setIsFormOpen(false)
        setEditingTodo(undefined)
      }
    } catch (error) {
      console.error("할 일 수정 오류:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 할 일 상태 변경 처리
   */
  const handleStatusChange = async (todoId: string) => {
    await toggleTodoStatus(todoId)
  }

  /**
   * 할 일 삭제 확인 처리
   */
  const handleDeleteClick = (todoId: string) => {
    setTodoToDelete(todoId)
    setDeleteDialogOpen(true)
  }

  /**
   * 할 일 삭제 확정 처리
   */
  const handleDeleteConfirm = async () => {
    if (!todoToDelete) return
    
    const success = await deleteTodo(todoToDelete)
    if (success) {
      setDeleteDialogOpen(false)
      setTodoToDelete(null)
    }
  }

  /**
   * 할 일 삭제 취소 처리
   */
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setTodoToDelete(null)
  }

  /**
   * 할 일 편집 모달 열기
   */
  const handleEditClick = (todo: Todo) => {
    setEditingTodo(todo)
    setIsFormOpen(true)
  }

  /**
   * 새 할 일 추가 모달 열기
   */
  const handleAddNewClick = () => {
    setEditingTodo(undefined)
    setIsFormOpen(true)
  }

  /**
   * 모달 닫기
   */
  const handleCloseModal = () => {
    setIsFormOpen(false)
    setEditingTodo(undefined)
  }



  // 로그아웃은 signOut 함수로 처리됨

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <Header user={currentUser} onLogout={signOut} />

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 할 일 목록 (2/3 너비) */}
          <div className="lg:col-span-2">
            <TodoList
              todos={todos}
              isLoading={isLoading}
              filter={filter}
              onStatusChange={handleStatusChange}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onAddNew={handleAddNewClick}
              onSearchChange={updateSearch}
              onStatusFilterChange={updateStatusFilter}
              onPriorityFilterChange={updatePriorityFilter}
              onSortChange={updateSort}
            />
          </div>

          {/* AI 요약 섹션 (1/3 너비) */}
          <div className="lg:col-span-1">
            <AISummary />
          </div>
        </div>
      </main>

      {/* 할 일 추가/편집 모달 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTodo ? "할 일 수정" : "새 할 일 추가"}
            </DialogTitle>
          </DialogHeader>
          <TodoForm
            initialTodo={editingTodo}
            onSubmit={editingTodo ? handleEditTodo : handleAddTodo}
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>할 일 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 할 일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * 보호된 메인 페이지 컴포넌트
 * 로그인한 사용자만 접근 가능
 */
export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  )
}
