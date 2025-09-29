# 배포 가이드

## Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해주세요:

### 필수 환경 변수

1. **Supabase 설정**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Google AI API 설정**
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
   ```

### 설정 방법

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택 → **Settings** 탭
3. **Environment Variables** 섹션
4. 각 변수를 **Name**과 **Value**로 입력
5. **Environment**는 `Production`, `Preview`, `Development` 모두 선택
6. **Save** 클릭

### 환경 변수 값 얻는 방법

#### Supabase
1. [Supabase 대시보드](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택 → **Settings** → **API**
3. `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Google AI API
1. [Google AI Studio](https://aistudio.google.com/) 접속
2. **Get API Key** 클릭
3. API 키 생성 → `GOOGLE_GENERATIVE_AI_API_KEY`

### 주의사항

- `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트에서 접근 가능
- API 키는 절대 공개 저장소에 커밋하지 마세요
- 환경 변수 변경 후 재배포가 필요합니다

### 로컬 개발 환경

로컬에서 개발할 때는 `.env.local` 파일을 생성하세요:

```bash
# .env.local (이 파일은 .gitignore에 포함되어 있습니다)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
```
