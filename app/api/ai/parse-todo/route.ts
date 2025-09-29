import { NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

/**
 * 입력 텍스트 전처리 함수
 * @param input 원본 입력 텍스트
 * @returns 전처리된 텍스트
 */
function preprocessInput(input: string): string {
  // 앞뒤 공백 제거
  let processed = input.trim()
  
  // 연속된 공백을 하나로 통합
  processed = processed.replace(/\s+/g, ' ')
  
  // 대소문자 정규화 (각 단어의 첫 글자만 대문자로 변환)
  processed = processed.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  
  // 특수 문자 정리 (이모지 제거, 기본 특수문자는 유지)
  processed = processed.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ.,!?@#$%^&*()_+\-=\[\]{}|;':"\\,.<>\/?~`]/gu, '')
  
  return processed
}

/**
 * 입력 텍스트 검증 함수
 * @param input 검증할 텍스트
 * @returns 검증 결과
 */
function validateInput(input: string): { isValid: boolean; error?: string; code?: string } {
  // 1. null/undefined 체크
  if (input == null) {
    return {
      isValid: false,
      error: "입력 텍스트가 필요합니다.",
      code: "MISSING_INPUT"
    }
  }

  // 2. 빈 문자열 체크
  if (input.length === 0) {
    return {
      isValid: false,
      error: "내용을 입력해 주세요.",
      code: "EMPTY_INPUT"
    }
  }

  // 3. 의미있는 문자 체크 (공백만 있는 경우)
  const meaningfulText = input.replace(/\s/g, '')
  if (meaningfulText.length === 0) {
    return {
      isValid: false,
      error: "내용을 입력해 주세요.",
      code: "INVALID_CONTENT"
    }
  }

  // 4. 최소 길이 체크 (의미있는 문자 기준)
  if (meaningfulText.length < 2) {
    return {
      isValid: false,
      error: "입력 텍스트는 최소 2자 이상이어야 합니다.",
      code: "TOO_SHORT"
    }
  }

  // 5. 최대 길이 체크
  if (input.length > 500) {
    return {
      isValid: false,
      error: "입력 텍스트는 최대 500자까지 입력 가능합니다.",
      code: "TOO_LONG"
    }
  }

  return { isValid: true }
}

/**
 * AI가 파싱한 할 일 데이터 타입
 */
interface ParsedTodoData {
  title?: string
  description?: string
  due_date?: string
  due_time?: string | null
  priority?: number
  tags?: string[]
  [key: string]: unknown
}

/**
 * AI 응답 후처리 함수
 * @param data AI에서 파싱된 데이터
 * @returns 후처리된 데이터
 */
function postprocessData(data: ParsedTodoData): ParsedTodoData {
  const today = new Date().toISOString().split('T')[0]
  
  // 제목 길이 조정
  if (data.title && data.title.length > 200) {
    data.title = data.title.substring(0, 200) + '...'
  }
  
  if (data.title && data.title.length < 2) {
    data.title = '새 할 일'
  }

  // 날짜 검증 및 조정
  if (data.due_date) {
    const inputDate = new Date(data.due_date)
    const todayDate = new Date(today)
    
    // 과거 날짜인 경우 오늘로 조정
    if (inputDate < todayDate) {
      data.due_date = today
    }
  } else {
    data.due_date = today
  }

  // 우선순위 범위 조정
  if (data.priority && (data.priority < 1 || data.priority > 3)) {
    data.priority = 2
  }

  // 태그 배열 정리
  if (data.tags && Array.isArray(data.tags)) {
    data.tags = data.tags
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.trim())
      .slice(0, 3) // 최대 3개
  } else {
    data.tags = []
  }

  return data
}

/**
 * 자연어 할 일 파싱 API
 * POST /api/ai/parse-todo
 * Gemini API를 사용하여 자연어를 구조화된 할 일 데이터로 변환
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
    const { input } = await request.json()
    
    // 1. 기본 입력 검증
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { 
          error: "입력 텍스트가 필요합니다.",
          code: "MISSING_INPUT"
        },
        { status: 400 }
      )
    }

    // 2. 원본 입력 검증 (전처리 전)
    const validationResult = validateInput(input)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          error: validationResult.error,
          code: validationResult.code
        },
        { status: 400 }
      )
    }

    // 3. 전처리
    const processedInput = preprocessInput(input)

    // AI SDK를 사용한 Gemini 모델 호출
    const { text } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: `
다음 자연어 입력을 구조화된 할 일 데이터로 변환해주세요.

입력: "${processedInput}"

다음 JSON 형식으로 응답해주세요:
{
  "title": "할 일 제목 (간결하게)",
  "description": "상세 설명 (선택사항)",
  "due_date": "YYYY-MM-DD 형식의 마감일",
  "due_time": "HH:MM 형식의 시간 (선택사항)",
  "priority": 1, 2, 또는 3 (1: 높음, 2: 보통, 3: 낮음),
  "tags": ["태그1", "태그2"] (선택사항)
}

=== 날짜 처리 규칙 ===
- "오늘": ${new Date().toISOString().split('T')[0]}
- "내일": ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- "모레": ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- "이번 주 금요일": 가장 가까운 금요일
- "다음 주 월요일": 다음 주의 월요일
- "주말": 가장 가까운 토요일 또는 일요일
- "다음 주": 다음 주의 월요일

=== 시간 처리 규칙 ===
- "아침": 09:00
- "점심": 12:00  
- "오후": 14:00 (기본값)
- "오후 3시": 15:00
- "오후 4시": 16:00
- "오후 5시": 17:00
- "저녁": 18:00
- "밤": 21:00
- "새벽": 06:00
- "오전": 09:00
- "오전 10시": 10:00
- "오전 11시": 11:00
- "정오": 12:00
- "자정": 00:00

=== 우선순위 키워드 ===
- 높음(1): "급하게", "중요한", "빨리", "꼭", "반드시", "긴급", "즉시", "빠르게"
- 보통(2): "보통", "적당히", 키워드 없음, 일반적인 할 일
- 낮음(3): "여유롭게", "천천히", "언젠가", "나중에", "여유있게"

=== 태그 분류 키워드 ===
- 업무: "회의", "보고서", "프로젝트", "업무", "발표", "프레젠테이션", "문서", "계획"
- 개인: "쇼핑", "친구", "가족", "개인", "여행", "휴가", "취미"
- 건강: "운동", "병원", "건강", "요가", "헬스", "산책", "검진"
- 학습: "공부", "책", "강의", "학습", "교육", "독서", "연구"

=== 응답 규칙 ===
1. 제목은 핵심 동작만 포함하여 간결하게 작성 (최대 50자)
2. 마감일이 명시되지 않은 경우 오늘 날짜로 설정
3. 시간 정보가 명시된 경우 due_time 필드에 HH:MM 형식으로 설정
4. "오후 3시"는 "15:00"으로, "오전 10시"는 "10:00"으로 변환
5. 우선순위는 키워드와 마감일 근접성을 종합적으로 판단
6. 태그는 내용에 맞는 카테고리를 1-2개 선택
7. 현재 날짜: ${new Date().toISOString().split('T')[0]}
8. JSON만 응답하고 다른 텍스트는 포함하지 마세요

=== 예시 ===
입력: "내일 오후 3시까지 중요한 팀 회의 준비하기"
출력: {
  "title": "팀 회의 준비",
  "description": "내일 오후 3시까지 팀 회의 준비",
  "due_date": "${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
  "due_time": "15:00",
  "priority": 1,
  "tags": ["업무"]
}
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
        { error: "AI 응답을 파싱할 수 없습니다." },
        { status: 500 }
      )
    }

    // 4. 후처리
    const postprocessedData = postprocessData(parsedData)
    
    // 5. 최종 데이터 검증 및 정규화
    const validatedData = {
      title: postprocessedData.title || processedInput.trim(),
      description: postprocessedData.description || "",
      due_date: postprocessedData.due_date || new Date().toISOString().split('T')[0],
      due_time: postprocessedData.due_time || null,
      priority: Math.max(1, Math.min(3, postprocessedData.priority || 2)),
      status: 'pending' as const,
      tags: postprocessedData.tags || []
    }

    // 날짜 형식 최종 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(validatedData.due_date)) {
      validatedData.due_date = new Date().toISOString().split('T')[0]
    }

    // 시간 형식 최종 검증
    if (validatedData.due_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(validatedData.due_time)) {
        validatedData.due_time = null
      }
    }

    return NextResponse.json(validatedData)

  } catch (error) {
    console.error("AI 파싱 API 오류:", error)
    
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

    // JSON 파싱 오류
    if (error instanceof Error && error.message.includes('JSON')) {
      return NextResponse.json(
        { 
          error: "AI 응답을 처리할 수 없습니다. 다시 시도해주세요.",
          code: "PARSE_ERROR"
        },
        { status: 500 }
      )
    }

    // 네트워크 오류
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('fetch')
    )) {
      return NextResponse.json(
        { 
          error: "네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.",
          code: "NETWORK_ERROR"
        },
        { status: 500 }
      )
    }

    // 기타 서버 오류
    return NextResponse.json(
      { 
        error: "AI 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    )
  }
}
