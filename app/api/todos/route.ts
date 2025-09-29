import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * 할 일 목록 조회 API
 * GET /api/todos
 * 쿼리 파라미터:
 * - search: 제목 검색 키워드
 * - status: 상태 필터 (pending, completed, all)
 * - priority: 우선순위 필터 (1, 2, 3, all)
 * - sortBy: 정렬 기준 (created_at, due_date, title, priority)
 * - sortOrder: 정렬 순서 (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 디버깅 로그
    console.log('API 요청 파라미터:', { search, status, priority, sortBy, sortOrder })

    // 쿼리 빌더 시작
    let query = supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)

    // 검색 필터 적용
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    // 상태 필터 적용
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 우선순위 필터 적용
    if (priority && priority !== 'all') {
      console.log('우선순위 필터 적용:', priority, '->', parseInt(priority))
      query = query.eq('priority', parseInt(priority))
    }

    // 정렬 적용
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data: todos, error } = await query

    if (error) {
      console.error("할 일 조회 오류:", error)
      return NextResponse.json(
        { error: "할 일 목록을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json(todos)
  } catch (error) {
    console.error("할 일 조회 API 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

/**
 * 새 할 일 생성 API
 * POST /api/todos
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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
    const { title, description, due_date, status = 'pending', priority = 2, tags = [] } = body

    // 디버깅 로그
    console.log('할 일 생성 요청 데이터:', { title, description, due_date, status, priority, tags })

    // 데이터 검증
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "할 일 제목은 필수입니다." },
        { status: 400 }
      )
    }

    // 새 할 일 생성
    const { data: newTodo, error } = await supabase
      .from('todos')
      .insert([
        {
          user_id: user.id,
          title: title.trim(),
          description: description?.trim() || null,
          due_date: due_date || null,
          status,
          priority,
          tags: Array.isArray(tags) ? tags : [],
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("할 일 생성 오류:", error)
      return NextResponse.json(
        { error: "할 일 생성 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json(newTodo, { status: 201 })
  } catch (error) {
    console.error("할 일 생성 API 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
