"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Loader2, 
  Sparkles, 
  TrendingUp,
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  Award,
  Zap,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Brain,
  Rocket,
  Trophy,
  ArrowRight,
  CheckSquare,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

/**
 * 완료율 분석 데이터 타입
 */
interface CompletionAnalysis {
  rate: string
  trend: string
  strengths: string
}

/**
 * 시간 관리 분석 데이터 타입
 */
interface TimeManagement {
  deadlineCompliance: string
  postponementPattern: string
  productiveHours: string
}

/**
 * 생산성 패턴 분석 데이터 타입
 */
interface ProductivityPatterns {
  bestPerformingAreas: string
  strugglingAreas: string
  priorityEffectiveness: string
}

/**
 * 동기부여 메시지 데이터 타입
 */
interface Motivation {
  achievements: string
  encouragement: string
  nextSteps: string
}

/**
 * 할 일 아이템 타입
 */
interface TodoItem {
  title: string
  priority: number
  due_date?: string
  tags: string[]
}

/**
 * 요일별 생산성 데이터 타입
 */
interface DailyProductivity {
  [day: string]: {
    total: number
    completed: number
  }
}

/**
 * 개선된 AI 요약 데이터 타입
 */
interface AISummaryData {
  summary: string
  urgentTasks: string[]
  remainingTodos: TodoItem[] // 남은 할 일 목록
  focusTasks: TodoItem[] // 집중할 작업
  completionAnalysis: CompletionAnalysis
  timeManagement: TimeManagement
  productivityPatterns: ProductivityPatterns
  insights: string[]
  recommendations: string[]
  motivation: Motivation
  dailyProductivity?: DailyProductivity // 요일별 생산성 (주간 분석에만)
}

/**
 * 개선된 AI 요약 및 분석 컴포넌트
 * 사용자의 할 일 목록을 AI로 분석하여 시각적이고 직관적인 인사이트를 제공
 */
export function AISummaryEnhanced() {
  const [todaySummary, setTodaySummary] = React.useState<AISummaryData | null>(null)
  const [weekSummary, setWeekSummary] = React.useState<AISummaryData | null>(null)
  const [isLoadingToday, setIsLoadingToday] = React.useState(false)
  const [isLoadingWeek, setIsLoadingWeek] = React.useState(false)
  const [errorToday, setErrorToday] = React.useState<string | null>(null)
  const [errorWeek, setErrorWeek] = React.useState<string | null>(null)

  /**
   * AI 요약 데이터 가져오기
   * @param period 분석 기간 (today/week)
   */
  const fetchAISummary = async (period: 'today' | 'week') => {
    const setIsLoading = period === 'today' ? setIsLoadingToday : setIsLoadingWeek
    const setSummary = period === 'today' ? setTodaySummary : setWeekSummary
    const setError = period === 'today' ? setErrorToday : setErrorWeek

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI 요약 생성에 실패했습니다.')
      }

      const data = await response.json()
      setSummary(data)
      toast.success(`${period === 'today' ? '오늘의' : '주간'} AI 분석이 완료되었습니다!`)
    } catch (error) {
      console.error("AI 요약 오류:", error)
      const errorMessage = error instanceof Error ? error.message : 'AI 요약 생성 중 오류가 발생했습니다.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 오늘의 요약 생성
   */
  const handleTodaySummary = () => {
    fetchAISummary('today')
  }

  /**
   * 이번 주 요약 생성
   */
  const handleWeekSummary = () => {
    fetchAISummary('week')
  }

  /**
   * 재시도 함수
   */
  const retryAnalysis = (period: 'today' | 'week') => {
    if (period === 'today') {
      setErrorToday(null)
      handleTodaySummary()
    } else {
      setErrorWeek(null)
      handleWeekSummary()
    }
  }

  /**
   * 완료율에서 숫자 추출
   */
  const extractCompletionRate = (text: string): number => {
    const match = text.match(/(\d+)%/)
    return match ? parseInt(match[1]) : 0
  }

  /**
   * 우선순위 텍스트 및 색상 반환
   */
  const getPriorityInfo = (priority: number) => {
    switch (priority) {
      case 1:
        return { text: '높음', color: 'text-red-600', bgColor: 'bg-red-100', icon: '🔴' }
      case 2:
        return { text: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🟡' }
      case 3:
        return { text: '낮음', color: 'text-green-600', bgColor: 'bg-green-100', icon: '🟢' }
      default:
        return { text: '보통', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '⚪' }
    }
  }

  /**
   * 마감일 포맷팅
   */
  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return '기한 없음'
    
    const date = new Date(dueDate)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘 마감'
    if (diffDays === 1) return '내일 마감'
    if (diffDays === -1) return '어제 마감'
    if (diffDays < 0) return `${Math.abs(diffDays)}일 지남`
    if (diffDays <= 7) return `${diffDays}일 후`
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  /**
   * 마감일 상태에 따른 색상 반환
   */
  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return 'text-gray-500'
    
    const date = new Date(dueDate)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600' // 지난 마감일
    if (diffDays === 0) return 'text-red-500' // 오늘 마감
    if (diffDays <= 2) return 'text-orange-500' // 2일 이내
    if (diffDays <= 7) return 'text-yellow-600' // 일주일 이내
    
    return 'text-gray-500'
  }

  /**
   * 요일별 생산성 차트 렌더링
   */
  const renderDailyProductivityChart = (dailyProductivity: DailyProductivity) => {
    const dayOrder = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
    const chartData = dayOrder.map(day => {
      const data = dailyProductivity[day] || { total: 0, completed: 0 }
      const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      return {
        day: day.substring(0, 1), // 월, 화, 수, 목, 금, 토, 일
        fullDay: day,
        total: data.total,
        completed: data.completed,
        completionRate
      }
    })

    const maxTotal = Math.max(...chartData.map(d => d.total), 1)

    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <BarChart3 className="w-5 h-5" />
            📊 요일별 생산성 패턴
          </CardTitle>
          <CardDescription className="text-purple-600">
            각 요일별 업무량과 완료율을 비교해보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 범례 */}
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-200 rounded"></div>
                <span className="text-gray-600">전체 할 일</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-600">완료된 할 일</span>
              </div>
            </div>

            {/* 차트 */}
            <div className="grid grid-cols-7 gap-2 h-32">
              {chartData.map((data) => (
                <div key={data.day} className="flex flex-col items-center">
                  {/* 막대 그래프 */}
                  <div className="flex-1 w-full flex flex-col justify-end pb-2">
                    <div className="relative w-full bg-gray-100 rounded-t-md overflow-hidden">
                      {/* 전체 할 일 막대 */}
                      <div 
                        className="w-full bg-purple-200 transition-all duration-500 ease-out"
                        style={{ 
                          height: `${Math.max((data.total / maxTotal) * 80, 4)}px`
                        }}
                      >
                        {/* 완료된 할 일 막대 */}
                        <div 
                          className="w-full bg-purple-500 transition-all duration-700 ease-out"
                          style={{ 
                            height: `${Math.max((data.completed / maxTotal) * 80, data.completed > 0 ? 2 : 0)}px`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* 요일 라벨 */}
                  <div className="text-center mt-2">
                    <div className="text-sm font-medium text-purple-800">{data.day}</div>
                    <div className="text-xs text-purple-600 mt-1">
                      {data.total > 0 ? `${data.completionRate}%` : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 상세 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-purple-200">
              {chartData
                .filter(d => d.total > 0)
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 4)
                .map((data) => (
                  <div key={data.fullDay} className="text-center p-2 bg-white/80 rounded-lg">
                    <div className="text-sm font-medium text-purple-800">{data.fullDay}</div>
                    <div className="text-xs text-purple-600 mt-1">
                      {data.completed}/{data.total} 완료
                    </div>
                    <div className="text-xs text-purple-500">
                      {data.completionRate}%
                    </div>
                  </div>
                ))}
            </div>

            {/* 인사이트 메시지 */}
            <div className="p-3 bg-white/80 rounded-lg border border-purple-200">
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  {(() => {
                    const bestDay = chartData.reduce((prev, current) => 
                      current.completionRate > prev.completionRate ? current : prev
                    )
                    const mostBusyDay = chartData.reduce((prev, current) => 
                      current.total > prev.total ? current : prev
                    )
                    
                    if (bestDay.total === 0) {
                      return "이번 주에 등록된 할 일이 없습니다."
                    }
                    
                    return `${bestDay.fullDay}에 가장 높은 완료율(${bestDay.completionRate}%)을 보였습니다. ${mostBusyDay.fullDay}에 가장 많은 할 일(${mostBusyDay.total}개)이 있었습니다.`
                  })()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  /**
   * 오늘의 요약 콘텐츠 렌더링
   */
  const renderTodayContent = () => {
    if (isLoadingToday) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <Brain className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-medium text-lg">🧠 AI가 오늘의 데이터를 분석하고 있어요</p>
            <p className="text-sm text-muted-foreground">잠시만 기다려주세요...</p>
          </div>
        </div>
      )
    }

    if (errorToday) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>{errorToday}</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => retryAnalysis('today')}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                재시도
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    if (!todaySummary) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>AI 요약 버튼을 클릭하여 오늘의 할 일을 분석해보세요</p>
        </div>
      )
    }

    const completionRate = extractCompletionRate(todaySummary.completionAnalysis?.rate || "0%")

    return (
      <div className="space-y-5">
          {/* 동기부여 헤더 */}
          {todaySummary.motivation && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 p-4 text-white">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">🎉 오늘의 성취</h3>
                    <p className="text-blue-100 text-xs">당신의 노력이 결실을 맺고 있어요</p>
                  </div>
                </div>
                <p className="text-sm font-medium mb-2">{todaySummary.motivation.achievements}</p>
                <p className="text-blue-100 text-sm">{todaySummary.motivation.encouragement}</p>
              </div>
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full"></div>
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full"></div>
            </div>
          )}

        {/* 완료율 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 md:col-span-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <BarChart3 className="w-5 h-5" />
                오늘의 완료율
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-blue-900">{completionRate}%</p>
                  <p className="text-sm text-blue-600">{todaySummary.completionAnalysis?.rate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-700">{todaySummary.completionAnalysis?.trend}</p>
                  <p className="text-xs text-blue-600 mt-1">{todaySummary.completionAnalysis?.strengths}</p>
                </div>
              </div>
              <Progress value={completionRate} className="h-3" />
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-orange-800 text-base">
                <Clock className="w-4 h-4" />
                시간 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-orange-900">{todaySummary.timeManagement?.deadlineCompliance}</p>
                <p className="text-orange-700">{todaySummary.timeManagement?.postponementPattern}</p>
                <div className="flex items-center gap-2 text-orange-600">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs">{todaySummary.timeManagement?.productiveHours}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 오늘 집중할 작업 하이라이트 */}
        {todaySummary.focusTasks && todaySummary.focusTasks.length > 0 && (
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Target className="w-5 h-5" />
                🎯 오늘 집중할 작업
                <Badge variant="destructive" className="ml-auto">
                  {todaySummary.focusTasks.length}개
                </Badge>
              </CardTitle>
              <CardDescription className="text-red-600">
                우선순위가 높거나 마감일이 임박한 중요한 작업들입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaySummary.focusTasks.map((task, index) => {
                  const priorityInfo = getPriorityInfo(task.priority)
                  const dueDateColor = getDueDateColor(task.due_date)
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/90 rounded-lg border border-red-100 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-red-900 truncate">{task.title}</h4>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                            <span>{priorityInfo.icon}</span>
                            <span>{priorityInfo.text}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`font-medium ${dueDateColor}`}>
                            📅 {formatDueDate(task.due_date)}
                          </span>
                          {task.tags.length > 0 && (
                            <div className="flex gap-1">
                              {task.tags.slice(0, 2).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {task.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{task.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <CheckSquare className="w-5 h-5 text-red-500" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 남은 할 일 목록과 우선순위 */}
        {todaySummary.remainingTodos && todaySummary.remainingTodos.length > 0 && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <CheckCircle2 className="w-5 h-5" />
                📋 남은 할 일 목록
                <Badge variant="secondary" className="ml-auto">
                  {todaySummary.remainingTodos.length}개
                </Badge>
              </CardTitle>
              <CardDescription className="text-blue-600">
                우선순위별로 정렬된 미완료 작업들입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaySummary.remainingTodos.slice(0, 8).map((todo, index) => {
                  const priorityInfo = getPriorityInfo(todo.priority)
                  const dueDateColor = getDueDateColor(todo.due_date)
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border border-blue-100 hover:bg-white/90 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${priorityInfo.bgColor}`}>
                        <span className={`text-sm font-bold ${priorityInfo.color}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-blue-900 truncate text-sm">{todo.title}</h4>
                          <span className="text-xs">{priorityInfo.icon}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`font-medium ${dueDateColor}`}>
                            {formatDueDate(todo.due_date)}
                          </span>
                          {todo.tags.length > 0 && (
                            <div className="flex gap-1">
                              {todo.tags.slice(0, 1).map((tag, tagIndex) => (
                                <span key={tagIndex} className="text-gray-500">
                                  #{tag}
                                </span>
                              ))}
                              {todo.tags.length > 1 && (
                                <span className="text-gray-400">+{todo.tags.length - 1}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {todaySummary.remainingTodos.length > 8 && (
                  <div className="text-center py-2">
                    <Badge variant="outline" className="text-blue-600">
                      +{todaySummary.remainingTodos.length - 8}개 더 있음
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 긴급한 할 일 (기존 AI 추천) */}
        {todaySummary.urgentTasks.length > 0 && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                ⚠️ AI 추천 긴급 작업
                <Badge variant="destructive" className="ml-auto">
                  {todaySummary.urgentTasks.length}개
                </Badge>
              </CardTitle>
              <CardDescription className="text-orange-600">
                AI가 분석한 즉시 처리가 필요한 작업들입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todaySummary.urgentTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border border-orange-100">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium text-orange-800">{task}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 생산성 패턴 */}
        {todaySummary.productivityPatterns && (
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Zap className="w-5 h-5" />
                📊 생산성 패턴 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white/80 rounded-lg border border-green-100">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-800 mb-2">✅ 강점 영역</h4>
                  <p className="text-sm text-green-700">{todaySummary.productivityPatterns.bestPerformingAreas}</p>
                </div>
                
                <div className="text-center p-4 bg-white/80 rounded-lg border border-amber-100">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-amber-800 mb-2">🎯 개선 포인트</h4>
                  <p className="text-sm text-amber-700">{todaySummary.productivityPatterns.strugglingAreas}</p>
                </div>
                
                <div className="text-center p-4 bg-white/80 rounded-lg border border-blue-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-blue-800 mb-2">⭐ 우선순위 효과</h4>
                  <p className="text-sm text-blue-700">{todaySummary.productivityPatterns.priorityEffectiveness}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-6" />

        {/* 인사이트 & 추천사항 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 인사이트 */}
          {todaySummary.insights && todaySummary.insights.length > 0 && (
              <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-cyan-800">
                <Brain className="w-5 h-5" />
                💡 AI 인사이트
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {todaySummary.insights.map((insight, index) => {
                  // 인사이트 유형에 따른 아이콘 선택
                  const getInsightIcon = (text: string, idx: number) => {
                    const lowerText = text.toLowerCase()
                    if (lowerText.includes('완료') || lowerText.includes('성공') || lowerText.includes('달성')) {
                      return { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100', emoji: '✅' }
                    }
                    if (lowerText.includes('시간') || lowerText.includes('속도') || lowerText.includes('빠른')) {
                      return { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100', emoji: '⏰' }
                    }
                    if (lowerText.includes('우선순위') || lowerText.includes('중요') || lowerText.includes('집중')) {
                      return { icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-100', emoji: '🎯' }
                    }
                    if (lowerText.includes('패턴') || lowerText.includes('경향') || lowerText.includes('트렌드')) {
                      return { icon: TrendingUp, color: 'text-indigo-600', bgColor: 'bg-indigo-100', emoji: '📈' }
                    }
                    if (lowerText.includes('개선') || lowerText.includes('향상') || lowerText.includes('발전')) {
                      return { icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-100', emoji: '⚡' }
                    }
                    // 기본 아이콘들을 순환
                    const defaultIcons = [
                      { icon: Lightbulb, color: 'text-orange-600', bgColor: 'bg-orange-100', emoji: '💡' },
                      { icon: Star, color: 'text-pink-600', bgColor: 'bg-pink-100', emoji: '⭐' },
                      { icon: Award, color: 'text-emerald-600', bgColor: 'bg-emerald-100', emoji: '🏆' },
                      { icon: Rocket, color: 'text-red-600', bgColor: 'bg-red-100', emoji: '🚀' }
                    ]
                    return defaultIcons[idx % defaultIcons.length]
                  }
                  
                  const iconInfo = getInsightIcon(insight, index)
                  
                  return (
                    <Card key={index} className="border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 ${iconInfo.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-lg">{iconInfo.emoji}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 leading-relaxed">{insight}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* 추천사항 */}
          {todaySummary.recommendations && todaySummary.recommendations.length > 0 && (
            <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Lightbulb className="w-5 h-5" />
                  🚀 실행 계획
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todaySummary.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white/80 rounded-lg border border-yellow-100 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 font-medium mb-1">Action #{index + 1}</p>
                      <p className="text-sm text-yellow-700 leading-relaxed">{recommendation}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-yellow-600 mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 다음 목표 */}
        {todaySummary.motivation?.nextSteps && (
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Rocket className="w-5 h-5" />
                🎯 다음 목표
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-white/80 rounded-lg border border-indigo-100">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-indigo-800 font-medium">{todaySummary.motivation.nextSteps}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  /**
   * 주간 요약 콘텐츠 렌더링
   */
  const renderWeekContent = () => {
    if (isLoadingWeek) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <PieChart className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-medium text-lg">📊 주간 패턴을 분석하고 있어요</p>
            <p className="text-sm text-muted-foreground">데이터를 종합하는 중...</p>
          </div>
        </div>
      )
    }

    if (errorWeek) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>{errorWeek}</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => retryAnalysis('week')}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                재시도
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    if (!weekSummary) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>AI 요약 버튼을 클릭하여 이번 주의 할 일을 분석해보세요</p>
        </div>
      )
    }

    const weekCompletionRate = extractCompletionRate(weekSummary.completionAnalysis?.rate || "0%")

    return (
      <div className="space-y-5">
        {/* 주간 성취 헤더 */}
        {weekSummary.motivation && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-green-600 p-4 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">🏆 이번 주 성과</h3>
                  <p className="text-emerald-100 text-xs">한 주간의 노력이 만든 성과</p>
                </div>
              </div>
              <p className="text-sm font-medium mb-2">{weekSummary.motivation.achievements}</p>
              <p className="text-emerald-100 text-sm">{weekSummary.motivation.encouragement}</p>
            </div>
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full"></div>
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full"></div>
          </div>
        )}

        {/* 주간 대시보드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {weekSummary.completionAnalysis && (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-emerald-800 text-base">
                  <TrendingUp className="w-4 h-4" />
                  주간 완료율
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-emerald-900 mb-1">{weekCompletionRate}%</p>
                  <p className="text-sm text-emerald-600">{weekSummary.completionAnalysis.rate}</p>
                </div>
                <Progress value={weekCompletionRate} className="h-2" />
                <p className="text-xs text-emerald-700 text-center">{weekSummary.completionAnalysis.trend}</p>
              </CardContent>
            </Card>
          )}

          {weekSummary.timeManagement && (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
                  <Clock className="w-4 h-4" />
                  시간 관리 패턴
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900">{weekSummary.timeManagement.deadlineCompliance}</p>
                  <p className="text-blue-700">{weekSummary.timeManagement.postponementPattern}</p>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs">{weekSummary.timeManagement.productiveHours}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {weekSummary.productivityPatterns && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-purple-800 text-base">
                  <Zap className="w-4 h-4" />
                  생산성 패턴
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-medium text-green-700 mb-1">✅ 강점</p>
                    <p className="text-green-600">{weekSummary.productivityPatterns.bestPerformingAreas}</p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-700 mb-1">🎯 개선</p>
                    <p className="text-amber-600">{weekSummary.productivityPatterns.strugglingAreas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 요일별 생산성 패턴 차트 */}
        {weekSummary.dailyProductivity && Object.keys(weekSummary.dailyProductivity).length > 0 && (
          <div className="mt-6">
            {renderDailyProductivityChart(weekSummary.dailyProductivity)}
          </div>
        )}

        {/* 주간 우선 처리할 일 */}
        {weekSummary.urgentTasks.length > 0 && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                🚨 이번 주 우선 처리할 일
                <Badge variant="destructive" className="ml-auto">
                  {weekSummary.urgentTasks.length}개
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weekSummary.urgentTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border border-orange-100">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium text-orange-800">{task}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-6" />

        {/* 주간 인사이트 & 다음 주 전략 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 주간 패턴 분석 */}
          {weekSummary.insights && weekSummary.insights.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-indigo-800">
                <BarChart3 className="w-5 h-5" />
                📈 주간 패턴 분석
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {weekSummary.insights.map((insight, index) => {
                  // 주간 인사이트 유형에 따른 아이콘 선택
                  const getWeekInsightIcon = (text: string, idx: number) => {
                    const lowerText = text.toLowerCase()
                    if (lowerText.includes('완료') || lowerText.includes('성공') || lowerText.includes('달성')) {
                      return { emoji: '🏆' }
                    }
                    if (lowerText.includes('시간') || lowerText.includes('요일') || lowerText.includes('패턴')) {
                      return { emoji: '📊' }
                    }
                    if (lowerText.includes('향상') || lowerText.includes('개선') || lowerText.includes('증가')) {
                      return { emoji: '📈' }
                    }
                    if (lowerText.includes('감소') || lowerText.includes('하락') || lowerText.includes('줄어')) {
                      return { emoji: '📉' }
                    }
                    if (lowerText.includes('집중') || lowerText.includes('생산성') || lowerText.includes('효율')) {
                      return { emoji: '🎯' }
                    }
                    if (lowerText.includes('균형') || lowerText.includes('안정') || lowerText.includes('일정')) {
                      return { emoji: '⚖️' }
                    }
                    // 기본 아이콘들을 순환
                    const defaultEmojis = ['📅', '💪', '⭐', '🔍', '💡', '🚀']
                    return { emoji: defaultEmojis[idx % defaultEmojis.length] }
                  }
                  
                  const iconInfo = getWeekInsightIcon(insight, index)
                  
                  return (
                    <Card key={index} className="border-indigo-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">{iconInfo.emoji}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-indigo-800 leading-relaxed">{insight}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* 다음 주 개선 전략 */}
          {weekSummary.recommendations && weekSummary.recommendations.length > 0 && (
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Rocket className="w-5 h-5" />
                  🚀 다음 주 개선 전략
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weekSummary.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white/80 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-800 font-medium mb-1">전략 #{index + 1}</p>
                      <p className="text-sm text-green-700 leading-relaxed">{recommendation}</p>
                    </div>
                    <CheckSquare className="w-4 h-4 text-green-600 mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 다음 주 계획 */}
        {weekSummary.motivation?.nextSteps && (
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Calendar className="w-5 h-5" />
                📅 다음 주 계획
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-white/80 rounded-lg border border-purple-100">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-purple-800 font-medium">{weekSummary.motivation.nextSteps}</p>
                  <p className="text-purple-600 text-sm mt-1">지속적인 성장을 위한 다음 단계</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">AI 요약 및 분석</h2>
      </div>

      {/* 탭 인터페이스 */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">오늘의 요약</TabsTrigger>
          <TabsTrigger value="week">이번 주 요약</TabsTrigger>
        </TabsList>

        {/* 오늘의 요약 탭 */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    오늘의 할 일 분석
                  </CardTitle>
                  <CardDescription>
                    AI가 오늘의 할 일을 분석하여 요약과 인사이트를 제공합니다
                  </CardDescription>
                </div>
                <Button
                  onClick={handleTodaySummary}
                  disabled={isLoadingToday}
                  className="gap-2"
                >
                  {isLoadingToday ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  AI 요약
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderTodayContent()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 이번 주 요약 탭 */}
        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    이번 주 할 일 분석
                  </CardTitle>
                  <CardDescription>
                    AI가 이번 주의 할 일을 분석하여 요약과 인사이트를 제공합니다
                  </CardDescription>
                </div>
                <Button
                  onClick={handleWeekSummary}
                  disabled={isLoadingWeek}
                  className="gap-2"
                >
                  {isLoadingWeek ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  AI 요약
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderWeekContent()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
