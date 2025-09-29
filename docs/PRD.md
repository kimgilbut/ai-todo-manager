**AI 할 일 관리 웹 서비스**
---
## 1. 개요 및 목표
본 서비스는 **AI 기반 할 일 관리 웹 애플리케이션**입니다.  
사용자는 기본적인 할 일 관리 기능(CRUD)을 제공받으며, AI 기능을 통해 자연어로 작성된 메모를 구조화된 할 일 데이터로 변환하거나, 일일/주간 단위 요약 및 분석 리포트를 자동으로 확인할 수 있습니다.  
목표는 단순한 할 일 기록을 넘어 **개인 생산성을 향상시키는 지능형 일정 관리 도구**를 제공하는 것입니다.
---
## 2. 주요 기능
### 2.1 인증
- **이메일/비밀번호 기반 로그인 및 회원가입**
- Supabase Auth 활용
- 사용자 계정 관리 및 세션 유지
### 2.2 할 일 관리
- **CRUD 기능**: 생성(Create), 조회(Read), 수정(Update), 삭제(Delete)
- 검색, 필터(상태·날짜·태그 등), 정렬(기한·생성일·제목)
### 2.3 AI 기능
- **자연어 → 할 일 생성**
  - 예:  
    입력 → `"내일 오전 10시에 팀 회의 준비"`  
    출력 →  
    ```json
    { "title": "팀 회의 준비", "due_date": "2025-09-19 10:00" }
    ```
- **AI 요약 및 분석**
  - 버튼 클릭 시 AI가 분석
  - **일일 요약**: 오늘 완료된 할 일, 남은 작업 정리
  - **주간 요약**: 이번 주 완료율, 진행 현황 분석
---
## 3. 화면 구성
### 3.1 로그인/회원가입 화면
- 이메일, 비밀번호 입력
- 회원가입 / 로그인 / 비밀번호 재설정
### 3.2 메인 화면
- 상단: 새 할 일 입력 (일반 입력 + AI 입력)
- 목록: 검색, 필터, 정렬 기능 포함
- 개별 할 일 편집 및 삭제
- **AI 요약 섹션**: “오늘 요약”, “이번 주 요약” 버튼 → 결과 표시
---
## 4. 사용 기술
- **프론트엔드**: Next.js, Tailwind CSS, Shadcn/ui
- **백엔드/DB**: Supabase (PostgreSQL + Auth)
- **AI 연동**: AI SDK (예: OpenAI/Gemini 등)
---
## 5. 데이터 구조 (Supabase)
### 5.1 users 테이블
- 사용자 계정 관리
- Supabase Auth와 연결
```sql
users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
)
### 5.2 todos 테이블 
- 사용자별 할 일 데이터 관리
todos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  status text CHECK (status IN ('pending','completed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
인덱스 권장:
(user_id, created_at)
(user_id, due_date)
(user_id, status)
---
## 6. 성공 지표
- 신규 가입 → 첫 할 일 등록까지 3분 이내
- AI 파싱 정확도 90% 이상
- AI 요약 기능 주간 재사용률 40% 이상
---
## 7. 비기능 요구사항
- 반응형 UI (모바일/데스크탑)
- 기본 CRUD 응답 속도 < 1초
- AI 응답 속도 < 3초
- Supabase Row Level Security(RLS) 적용: 사용자별 데이터 격리
---
## 8. 향후 확장 기능 (Optional)
- 캘린더 뷰
- 리마인더/알림 기능
- 외부 캘린더(Google, Outlook) 연동
- 팀/협업 기능
---
## 9. API 설계 예시
### POST /api/ai/parse
- 입력: { "input": "내일 오전 10시에 팀 회의 준비" }
- 출력:
{
  "title": "팀 회의 준비",
  "due_date": "2025-09-19T10:00:00+09:00",
  "status": "pending"
}
### GET /api/ai/summary/daily
- 출력:
{
  "completed": 5,
  "pending": 3,
  "overdue": 1,
  "highlights": ["보고서 작성 완료", "회의 준비 진행 중"]
}
---
## 10. 릴리스 범위
### MVP
- 회원가입/로그인
- 할 일 CRUD
- 검색/필터/정렬
- AI 기반 할 일 생성
- 일일/주간 요약
### 차후 업데이트
- 캘린더 뷰, 알림, 협업 기능
