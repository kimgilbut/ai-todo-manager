import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * 할 일 업데이트 데이터 타입
 */
interface TodoUpdateData {
  title?: string
  description?: string | null
  due_date?: string | null
  status?: 'pending' | 'in_progress' | 'completed'
  priority?: 1 | 2 | 3
}

/**
 * 개별 할 일 조회 API
 * GET /api/todos/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: todoId } = await params
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    // 할 일 조회 (본인 소유 확인 포함)
    const { data: todo, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "할 일을 찾을 수 없습니다." },
          { status: 404 }
        )
      }
      console.error("할 일 조회 오류:", error)
      return NextResponse.json(
        { error: "할 일 조회 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error("할 일 조회 API 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

/**
 * 할 일 수정 API
 * PUT /api/todos/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: todoId } = await params
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    // 요청 데이터 파싱
    const body = await request.json()
    const { title, description, due_date, status, priority } = body

    // 기본 데이터 검증
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return NextResponse.json(
        { error: "할 일 제목은 필수입니다." },
        { status: 400 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: TodoUpdateData = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (due_date !== undefined) updateData.due_date = due_date || null
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority

    // 할 일 수정 (본인 소유 확인 포함)
    const { data: updatedTodo, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', todoId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "할 일을 찾을 수 없거나 수정 권한이 없습니다." },
          { status: 404 }
        )
      }
      console.error("할 일 수정 오류:", error)
      return NextResponse.json(
        { error: "할 일 수정 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedTodo)
  } catch (error) {
    console.error("할 일 수정 API 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

/**
 * 할 일 삭제 API
 * DELETE /api/todos/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: todoId } = await params
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    // 할 일 삭제 (본인 소유 확인 포함)
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', user.id)

    if (error) {
      console.error("할 일 삭제 오류:", error)
      return NextResponse.json(
        { error: "할 일 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "할 일이 성공적으로 삭제되었습니다." },
      { status: 200 }
    )
  } catch (error) {
    console.error("할 일 삭제 API 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
