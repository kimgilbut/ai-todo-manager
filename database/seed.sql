-- =====================================================
-- AI 할 일 관리 웹 서비스 - 개발용 시드 데이터
-- 개발 및 테스트 환경에서만 사용
-- =====================================================

-- 주의: 프로덕션 환경에서는 이 파일을 실행하지 마세요!

-- =====================================================
-- 개발용 샘플 사용자 데이터
-- =====================================================

-- 테스트 사용자 1: 김개발자
INSERT INTO users (id, email, name, avatar_url) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'developer@example.com',
    '김개발자',
    NULL
) ON CONFLICT (id) DO NOTHING;

-- 테스트 사용자 2: 이디자이너
INSERT INTO users (id, email, name, avatar_url) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    'designer@example.com',
    '이디자이너',
    'https://images.unsplash.com/photo-1494790108755-2616b612b577?w=150'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 개발용 샘플 할 일 데이터
-- =====================================================

-- 김개발자의 할 일들
INSERT INTO todos (user_id, title, description, due_date, status, priority) VALUES 

-- 진행 중인 할 일들
(
    '550e8400-e29b-41d4-a716-446655440001',
    'AI 할 일 관리 앱 완성하기',
    'PRD를 바탕으로 기능 구현 및 테스트 완료. Supabase 연동, AI 기능, 반응형 UI 구현 필요.',
    NOW() + INTERVAL '3 days',
    'pending',
    1
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    '팀 회의 참석',
    '주간 스프린트 리뷰 및 다음 주 계획 논의. 진행 상황 발표 준비.',
    NOW() + INTERVAL '1 day',
    'pending',
    2
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Supabase RLS 정책 설정',
    '사용자별 데이터 격리를 위한 Row Level Security 정책 구현',
    NOW() + INTERVAL '2 days',
    'pending',
    1
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    '코드 문서화 작업',
    '컴포넌트별 주석 추가 및 README 업데이트',
    NOW() + INTERVAL '5 days',
    'pending',
    3
),

-- 완료된 할 일들
(
    '550e8400-e29b-41d4-a716-446655440001',
    '코드 리뷰 완료',
    '동료의 PR 검토 및 피드백 제공. 코드 품질 개선 제안.',
    NOW() - INTERVAL '2 hours',
    'completed',
    2
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'shadcn/ui 컴포넌트 설정',
    '프로젝트에 필요한 UI 컴포넌트 라이브러리 설치 및 설정',
    NOW() - INTERVAL '1 day',
    'completed',
    2
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Next.js 프로젝트 초기 설정',
    'TypeScript, Tailwind CSS, ESLint 설정 완료',
    NOW() - INTERVAL '3 days',
    'completed',
    1
),

-- 지연된 할 일 (테스트용)
(
    '550e8400-e29b-41d4-a716-446655440001',
    '성능 최적화 작업',
    '이미지 최적화, 코드 분할, 번들 크기 최적화',
    NOW() - INTERVAL '1 day',
    'pending',
    2
);

-- 이디자이너의 할 일들
INSERT INTO todos (user_id, title, description, due_date, status, priority) VALUES 

-- 진행 중인 할 일들
(
    '550e8400-e29b-41d4-a716-446655440002',
    'UI/UX 디자인 시스템 구축',
    '컬러 팔레트, 타이포그래피, 컴포넌트 가이드라인 정리',
    NOW() + INTERVAL '4 days',
    'pending',
    1
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '모바일 반응형 디자인 검토',
    '모든 화면의 모바일 호환성 확인 및 개선',
    NOW() + INTERVAL '2 days',
    'pending',
    2
),

-- 완료된 할 일들
(
    '550e8400-e29b-41d4-a716-446655440002',
    '로그인 화면 디자인',
    '사용자 친화적이고 접근성을 고려한 로그인 UI 디자인',
    NOW() - INTERVAL '3 hours',
    'completed',
    1
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '아이콘 세트 제작',
    'Lucide React 기반 커스텀 아이콘 제작',
    NOW() - INTERVAL '2 days',
    'completed',
    3
);

-- =====================================================
-- 개발용 통계 확인 쿼리
-- =====================================================

-- 사용자별 할 일 통계 확인
SELECT 
    u.name as user_name,
    uts.*
FROM user_todo_stats uts
JOIN users u ON u.id = uts.user_id
ORDER BY u.name;

-- 할 일 상태별 분포 확인
SELECT 
    status,
    priority,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM todos
GROUP BY status, priority
ORDER BY status, priority;

-- 마감일이 임박한 할 일 확인
SELECT 
    u.name,
    t.title,
    t.due_date,
    CASE 
        WHEN t.due_date < NOW() THEN '지연'
        WHEN t.due_date < NOW() + INTERVAL '1 day' THEN '오늘 마감'
        WHEN t.due_date < NOW() + INTERVAL '3 days' THEN '3일 이내'
        ELSE '여유 있음'
    END as urgency
FROM todos t
JOIN users u ON u.id = t.user_id
WHERE t.status = 'pending' AND t.due_date IS NOT NULL
ORDER BY t.due_date;

-- =====================================================
-- 시드 데이터 생성 완료
-- =====================================================

SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(t.id) as total_todos,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_todos,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_todos
FROM users u
LEFT JOIN todos t ON u.id = t.user_id;
