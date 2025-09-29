import { NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

/**
 * AI 요약 및 분석 API
 * POST /api/ai/summary
 * 사용자의 할 일 목록을 분석하여 요약과 인사이트를 제공
 */
export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google AI API 키가 설정되지 않았습니다." },
        { status: 500 }
      )
    }

    // 요청 데이터 파싱
    const { period } = await request.json()
    
    // 기간 검증
    if (!period || !['today', 'week'].includes(period)) {
      return NextResponse.json(
        { 
          error: "분석 기간이 필요합니다. (today 또는 week)",
          code: "INVALID_PERIOD"
        },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    // 현재 기간 할 일 목록 조회
    let currentQuery = supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)

    // 히스토리 비교를 위한 이전 기간 할 일 목록 조회
    let previousQuery = supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)

    // 기간별 필터링
    const now = new Date()
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date
    
    if (period === 'today') {
      // 오늘과 어제 비교
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else {
      // 이번 주와 지난 주 비교
      const dayOfWeek = now.getDay()
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 7)
      previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek - 7)
      previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
    }

    // 현재 기간과 생성일/마감일 기준으로 필터링
    currentQuery = currentQuery
      .or(`and(created_at.gte.${currentStart.toISOString()},created_at.lt.${currentEnd.toISOString()}),and(due_date.gte.${currentStart.toISOString().split('T')[0]},due_date.lt.${currentEnd.toISOString().split('T')[0]})`)
    
    previousQuery = previousQuery
      .or(`and(created_at.gte.${previousStart.toISOString()},created_at.lt.${previousEnd.toISOString()}),and(due_date.gte.${previousStart.toISOString().split('T')[0]},due_date.lt.${previousEnd.toISOString().split('T')[0]})`)

    // 병렬로 데이터 조회
    const [currentResult, previousResult] = await Promise.all([
      currentQuery.order('created_at', { ascending: false }),
      previousQuery.order('created_at', { ascending: false })
    ])

    const { data: todos, error: todosError } = currentResult
    const { data: previousTodos, error: previousTodosError } = previousResult

    if (todosError || previousTodosError) {
      console.error("할 일 목록 조회 오류:", todosError || previousTodosError)
      return NextResponse.json(
        { error: "할 일 목록을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    if (!todos || todos.length === 0) {
      return NextResponse.json({
        summary: period === 'today' ? "오늘 등록된 할 일이 없습니다." : "이번 주 등록된 할 일이 없습니다.",
        urgentTasks: [],
        insights: ["새로운 할 일을 추가해보세요!"],
        recommendations: ["할 일을 추가하여 생산성을 높여보세요."]
      })
    }

    // 현재 기간 할 일 데이터 전처리
    const completedTodos = todos.filter(todo => todo.status === 'completed')
    const pendingTodos = todos.filter(todo => todo.status === 'pending')
    const urgentTodos = todos.filter(todo => todo.priority === 1)
    const completionRate = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0

    // 이전 기간 비교 데이터
    const previousCompletedTodos = previousTodos?.filter(todo => todo.status === 'completed') || []
    const previousCompletionRate = previousTodos && previousTodos.length > 0 ? Math.round((previousCompletedTodos.length / previousTodos.length) * 100) : 0
    const completionRateChange = completionRate - previousCompletionRate

    // 시간대별 분석을 위한 데이터 타입 정의
    type TimeAnalysisItem = {
      hour: number
      title: string
      status: string
      priority: number
      created_at: string
    }

    // 시간대별 분석을 위한 데이터 준비
    const timeAnalysis: TimeAnalysisItem[] = todos
      .filter(todo => todo.due_date) // due_date가 있는 것만 필터링
      .map(todo => {
        const date = new Date(todo.due_date!)
        return {
          hour: date.getHours(),
          title: todo.title,
          status: todo.status,
          priority: todo.priority,
          created_at: todo.created_at
        }
      })

    // 마감일 준수율 분석
    const overdueTodos = todos.filter(todo => {
      if (!todo.due_date) return false
      const dueDate = new Date(todo.due_date)
      const today = new Date()
      return todo.status !== 'completed' && dueDate < today
    })
    const onTimeTodos = completedTodos.filter(todo => {
      if (!todo.due_date) return true
      const dueDate = new Date(todo.due_date)
      const completedDate = new Date(todo.updated_at || todo.created_at)
      return completedDate <= dueDate
    })
    const deadlineComplianceRate = completedTodos.length > 0 ? Math.round((onTimeTodos.length / completedTodos.length) * 100) : 0

    // 우선순위별 완료 패턴 분석
    const priorityAnalysis = {
      high: { total: todos.filter(t => t.priority === 1).length, completed: todos.filter(t => t.priority === 1 && t.status === 'completed').length },
      medium: { total: todos.filter(t => t.priority === 2).length, completed: todos.filter(t => t.priority === 2 && t.status === 'completed').length },
      low: { total: todos.filter(t => t.priority === 3).length, completed: todos.filter(t => t.priority === 3 && t.status === 'completed').length }
    }

    // 시간대별 생산성 분석
    const hourlyProductivity = timeAnalysis.reduce((acc, item) => {
      const hour = item.hour
      if (!acc[hour]) acc[hour] = { total: 0, completed: 0 }
      acc[hour].total++
      if (item.status === 'completed') acc[hour].completed++
      return acc
    }, {} as Record<number, { total: number, completed: number }>)

    // 태그별 분석
    const tagAnalysis = todos.reduce((acc, todo) => {
      const tags: string[] = todo.tags || []
      tags.forEach((tag: string) => {
        if (!acc[tag]) acc[tag] = { total: 0, completed: 0 }
        acc[tag].total++
        if (todo.status === 'completed') acc[tag].completed++
      })
      return acc
    }, {} as Record<string, { total: number, completed: number }>)

    // 요일별 생산성 분석 (주간 분석에만 적용)
    const dailyProductivity = period === 'week' ? todos.reduce((acc, todo) => {
      // 할 일의 생성일 또는 마감일을 기준으로 요일 분석
      const dateToAnalyze = todo.due_date || todo.created_at
      if (dateToAnalyze) {
        const date = new Date(dateToAnalyze)
        const dayOfWeek = date.getDay() // 0: 일요일, 1: 월요일, ..., 6: 토요일
        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
        const dayName = dayNames[dayOfWeek]
        
        if (!acc[dayName]) acc[dayName] = { total: 0, completed: 0 }
        acc[dayName].total++
        if (todo.status === 'completed') acc[dayName].completed++
      }
      return acc
    }, {} as Record<string, { total: number, completed: number }>) : {}

    // 연기 패턴 분석 (updated_at과 due_date 비교)
    const postponedTodos = todos.filter(todo => {
      if (!todo.due_date || !todo.updated_at) return false
      const dueDate = new Date(todo.due_date)
      const updatedDate = new Date(todo.updated_at)
      const createdDate = new Date(todo.created_at)
      return updatedDate > createdDate && todo.status !== 'completed' && updatedDate > dueDate
    })
    const postponementRate = todos.length > 0 ? Math.round((postponedTodos.length / todos.length) * 100) : 0

    // AI 분석을 위한 종합 데이터 구성
    const analysisData = {
      period: period === 'today' ? '오늘' : '이번 주',
      previousPeriod: period === 'today' ? '어제' : '지난 주',
      
      // 기본 통계
      totalTasks: todos.length,
      completedTasks: completedTodos.length,
      pendingTasks: pendingTodos.length,
      urgentTasks: urgentTodos.length,
      overdueTasks: overdueTodos.length,
      
      // 완료율 분석
      completionRate,
      previousCompletionRate,
      completionRateChange,
      deadlineComplianceRate,
      postponementRate,
      
      // 우선순위별 분석
      priorityAnalysis,
      
      // 시간 관리 분석
      hourlyProductivity,
      timeAnalysis,
      
      // 태그별 분석
      tagAnalysis,
      
      // 요일별 생산성 (주간 분석에만 포함)
      dailyProductivity,
      
      // 할 일 목록 상세
      todos: todos.map(todo => ({
        title: todo.title,
        status: todo.status,
        priority: todo.priority,
        due_date: todo.due_date,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
        tags: todo.tags || []
      })),
      
      // 비교 데이터
      previousTodos: previousTodos ? previousTodos.map(todo => ({
        title: todo.title,
        status: todo.status,
        priority: todo.priority,
        due_date: todo.due_date,
        created_at: todo.created_at,
        tags: todo.tags || []
      })) : []
    }

    // AI SDK를 사용한 Gemini 모델 호출 - 개선된 시스템 프롬프트
    const { text } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: `
당신은 개인 생산성 분석 전문가입니다. 사용자의 할 일 관리 데이터를 분석하여 실용적이고 격려적인 인사이트를 제공해주세요.

=== 분석 데이터 ===
분석 기간: ${analysisData.period}
비교 기간: ${analysisData.previousPeriod}

## 1. 완료율 분석
- 현재 기간: 총 ${analysisData.totalTasks}개 중 ${analysisData.completedTasks}개 완료 (${analysisData.completionRate}%)
- 이전 기간: 완료율 ${analysisData.previousCompletionRate}%
- 변화: ${analysisData.completionRateChange > 0 ? '+' : ''}${analysisData.completionRateChange}%p
- 마감일 준수율: ${analysisData.deadlineComplianceRate}%
- 연기율: ${analysisData.postponementRate}%

## 2. 우선순위별 완료 패턴
- 높음(1순위): ${analysisData.priorityAnalysis.high.completed}/${analysisData.priorityAnalysis.high.total}개 완료
- 보통(2순위): ${analysisData.priorityAnalysis.medium.completed}/${analysisData.priorityAnalysis.medium.total}개 완료
- 낮음(3순위): ${analysisData.priorityAnalysis.low.completed}/${analysisData.priorityAnalysis.low.total}개 완료

## 3. 시간대별 생산성
${Object.entries(analysisData.hourlyProductivity)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([hour, data]) => {
    const hourData = data as { total: number, completed: number }
    return `- ${hour}시: ${hourData.completed}/${hourData.total}개 완료 (${Math.round((hourData.completed/hourData.total)*100)}%)`
  })
  .join('\n')}

## 4. 태그별 업무 분포
${Object.entries(analysisData.tagAnalysis)
  .map(([tag, data]) => {
    const tagData = data as { total: number, completed: number }
    return `- ${tag}: ${tagData.completed}/${tagData.total}개 완료 (${Math.round((tagData.completed/tagData.total)*100)}%)`
  })
  .join('\n')}

## 5. 할 일 목록 상세
${analysisData.todos.map(todo => {
  const status = todo.status === 'completed' ? '✅ 완료' : '⏳ 진행중'
  const priority = todo.priority === 1 ? '🔴 높음' : todo.priority === 2 ? '🟡 보통' : '🟢 낮음'
  const dueDate = todo.due_date ? new Date(todo.due_date).toLocaleDateString() : '기한 없음'
  const tags = todo.tags.length > 0 ? `[${todo.tags.join(', ')}]` : ''
  return `- ${todo.title} ${status} ${priority} (마감: ${dueDate}) ${tags}`
}).join('\n')}

=== 분석 요구사항 ===
${period === 'today' ? `
**오늘의 분석 초점:**
- 당일 집중도와 생산성 패턴
- 남은 할 일의 우선순위 조정
- 실시간 시간 관리 팁
- 하루 마무리를 위한 구체적 조언
` : `
**주간 분석 초점:**
- 주간 생산성 트렌드와 패턴
- 요일별 업무 분포 효율성
- 다음 주 계획 수립을 위한 제안
- 장기적 습관 개선 방향
`}

=== JSON 응답 형식 ===
{
  "summary": "${period === 'today' ? '오늘' : '이번 주'} 핵심 성과 요약",
  "urgentTasks": ["미완료 긴급 할 일들"],
  "completionAnalysis": {
    "rate": "완료율과 변화 분석",
    "trend": "개선/하락 트렌드 설명",
    "strengths": "잘하고 있는 부분"
  },
  "timeManagement": {
    "deadlineCompliance": "마감일 준수 패턴 분석",
    "postponementPattern": "연기 경향과 원인",
    "productiveHours": "가장 생산적인 시간대"
  },
  "productivityPatterns": {
    "bestPerformingAreas": "가장 잘 완료하는 작업 유형",
    "strugglingAreas": "어려움을 겪는 영역",
    "priorityEffectiveness": "우선순위 설정 효과성"
  },
  "insights": [
    "데이터 기반 구체적 인사이트",
    "패턴 분석 결과",
    "개선 포인트 발견사항"
  ],
  "recommendations": [
    "즉시 실행 가능한 구체적 조언",
    "시간 관리 개선 팁",
    "우선순위 조정 제안",
    "업무 분산 방법"
  ],
  "motivation": {
    "achievements": "이번 기간 성취사항 강조",
    "encouragement": "격려와 동기부여 메시지",
    "nextSteps": "다음 목표 제시"
  }
}

=== 분석 원칙 ===
1. **긍정적 접근**: 성취를 먼저 인정하고 개선점을 격려 톤으로 제시
2. **구체성**: 모든 조언은 실행 가능하고 구체적으로 작성
3. **데이터 기반**: 제공된 수치와 패턴을 근거로 분석
4. **개인화**: 사용자의 고유한 패턴에 맞춘 맞춤형 조언
5. **실용성**: 일상에서 바로 적용할 수 있는 실용적 팁 제공
6. **동기부여**: 지속 가능한 동기부여와 성장 마인드셋 강화

=== 응답 규칙 ===
- 한국어로 친근하고 격려하는 톤 사용
- JSON 형식만 응답 (마크다운이나 추가 텍스트 금지)
- 모든 필드는 의미 있는 내용으로 채우기
- 데이터가 없는 경우 격려와 제안으로 대체
- 구체적인 수치와 예시 포함
`,
    })

    // JSON 파싱 시도
    let parsedData
    try {
      // JSON 부분만 추출 (```json``` 마크다운 제거)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : text
      parsedData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError)
      console.error("AI 응답:", text)
      return NextResponse.json(
        { 
          error: "AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.",
          code: "PARSE_ERROR"
        },
        { status: 500 }
      )
    }

    // 남은 할 일 목록 (미완료 할 일들을 우선순위별로 정렬)
    const remainingTodos = pendingTodos
      .sort((a, b) => a.priority - b.priority) // 1=높음, 2=보통, 3=낮음
      .map(todo => ({
        title: todo.title,
        priority: todo.priority,
        due_date: todo.due_date,
        tags: todo.tags || []
      }))

    // 오늘 집중할 작업 (높은 우선순위 + 마감일 임박)
    const today = new Date().toISOString().split('T')[0]
    const focusTasks = pendingTodos
      .filter(todo => {
        const isHighPriority = todo.priority === 1
        const isDueToday = todo.due_date === today
        const isDueSoon = todo.due_date && new Date(todo.due_date) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2일 이내
        return isHighPriority || isDueToday || isDueSoon
      })
      .sort((a, b) => {
        // 마감일 임박 > 높은 우선순위 순으로 정렬
        if (a.due_date === today && b.due_date !== today) return -1
        if (b.due_date === today && a.due_date !== today) return 1
        return a.priority - b.priority
      })
      .slice(0, 5) // 최대 5개까지
      .map(todo => ({
        title: todo.title,
        priority: todo.priority,
        due_date: todo.due_date,
        tags: todo.tags || []
      }))

    // 응답 데이터 검증 및 정리
    const validatedData = {
      summary: parsedData.summary || `${analysisData.period} 총 ${analysisData.totalTasks}개의 할 일 중 ${analysisData.completedTasks}개 완료 (${analysisData.completionRate}%)`,
      urgentTasks: Array.isArray(parsedData.urgentTasks) ? parsedData.urgentTasks : [],
      remainingTodos, // 남은 할 일 목록 추가
      focusTasks, // 집중할 작업 추가
      completionAnalysis: parsedData.completionAnalysis || {
        rate: `완료율 ${analysisData.completionRate}%`,
        trend: analysisData.completionRateChange > 0 ? "이전 기간 대비 향상" : "안정적인 수준 유지",
        strengths: "꾸준한 진행을 보이고 있습니다"
      },
      timeManagement: parsedData.timeManagement || {
        deadlineCompliance: `마감일 준수율 ${analysisData.deadlineComplianceRate}%`,
        postponementPattern: analysisData.postponementRate > 0 ? "일부 연기 발생" : "계획대로 진행",
        productiveHours: "다양한 시간대에 고른 활동"
      },
      productivityPatterns: parsedData.productivityPatterns || {
        bestPerformingAreas: "기본적인 할 일 관리를 잘하고 있습니다",
        strugglingAreas: "더 많은 데이터로 패턴을 분석해보세요",
        priorityEffectiveness: "우선순위 설정이 도움이 되고 있습니다"
      },
      insights: Array.isArray(parsedData.insights) ? parsedData.insights : ["더 많은 할 일을 추가하시면 더 자세한 분석을 제공할 수 있습니다"],
      recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations : ["꾸준히 할 일을 관리하고 있으니 계속 진행하세요"],
      motivation: parsedData.motivation || {
        achievements: `${analysisData.period} ${analysisData.completedTasks}개의 할 일을 완료했습니다!`,
        encouragement: "꾸준한 노력이 보기 좋습니다",
        nextSteps: "다음에도 이런 속도로 진행해보세요"
      }
    }

    return NextResponse.json(validatedData)

  } catch (error) {
    console.error("AI 요약 API 오류:", error)
    
    // API 호출 한도 초과 오류
    if (error instanceof Error && (
      error.message.includes('quota') || 
      error.message.includes('rate limit') ||
      error.message.includes('429')
    )) {
      return NextResponse.json(
        { 
          error: "AI 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.",
          code: "RATE_LIMIT_EXCEEDED"
        },
        { status: 429 }
      )
    }

    // Google AI API 키 오류
    if (error instanceof Error && (
      error.message.includes('API_KEY') ||
      error.message.includes('authentication') ||
      error.message.includes('401')
    )) {
      return NextResponse.json(
        { 
          error: "AI 서비스 인증에 실패했습니다.",
          code: "AUTHENTICATION_FAILED"
        },
        { status: 401 }
      )
    }

    // 기타 서버 오류
    return NextResponse.json(
      { 
        error: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    )
  }
}

