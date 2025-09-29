# AI 할 일 관리 서비스

AI가 도와주는 똑똑한 할 일 관리 서비스입니다. Next.js 15, React 19, TypeScript로 구축되었으며, AI 기반 자연어 처리와 스마트 분석 기능을 제공합니다.

## 주요 기능

- 🤖 **AI 자연어 처리**: 자연어로 할 일을 입력하면 AI가 자동으로 분석하여 구조화
- 📊 **스마트 분석**: AI가 생산성 패턴을 분석하고 개선 방안 제시
- 🎯 **우선순위 관리**: 중요도에 따른 할 일 분류 및 관리
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 환경 지원
- 🔐 **안전한 인증**: Supabase 기반 사용자 인증 및 데이터 보안

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS 4, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: Google AI SDK (Gemini)
- **Form**: React Hook Form, Zod
- **State**: React Context, Custom Hooks

## 환경 설정

프로젝트를 실행하기 전에 다음 환경 변수를 설정해야 합니다:

```bash
# .env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 시작하기

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm run dev
```

3. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 코드 품질 검사
npm run lint
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
