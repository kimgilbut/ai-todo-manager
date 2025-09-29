-- =====================================================
-- AI 할 일 관리 웹 서비스 - Supabase 데이터베이스 스키마
-- PRD 5. 데이터 구조 기반으로 작성
-- =====================================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENUMS (열거형) 정의
-- =====================================================

-- 할 일 상태 열거형
CREATE TYPE todo_status AS ENUM ('pending', 'completed');

-- =====================================================
-- 2. TABLES (테이블) 생성
-- =====================================================

-- 2.1 users 테이블
-- Supabase Auth와 연결되는 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS users (
    -- 기본 식별자 (Supabase Auth의 user.id와 동일)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 사용자 이메일 (Supabase Auth에서 동기화)
    email TEXT UNIQUE NOT NULL,
    
    -- 사용자 표시 이름
    name TEXT,
    
    -- 프로필 이미지 URL
    avatar_url TEXT,
    
    -- 계정 생성 시간
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- 마지막 업데이트 시간
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2.2 todos 테이블
-- 사용자별 할 일 데이터 관리
CREATE TABLE IF NOT EXISTS todos (
    -- 할 일 고유 식별자
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 사용자 외래키 (users 테이블 참조)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 할 일 제목 (필수)
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    
    -- 할 일 상세 설명 (선택사항)
    description TEXT,
    
    -- 마감일 (선택사항)
    due_date TIMESTAMPTZ,
    
    -- 할 일 상태 (기본값: pending)
    status todo_status DEFAULT 'pending' NOT NULL,
    
    -- 우선순위 (1: 높음, 2: 보통, 3: 낮음)
    priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)),
    
    -- 생성 시간
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- 마지막 업데이트 시간
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. INDEXES (인덱스) 생성
-- =====================================================

-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- todos 테이블 인덱스 (PRD 권장사항 포함)
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_created_at ON todos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_user_due_date ON todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_todos_user_status ON todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_user_priority ON todos(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_todos_status_due_date ON todos(status, due_date) WHERE due_date IS NOT NULL;

-- =====================================================
-- 4. TRIGGERS (트리거) 생성
-- =====================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블 updated_at 트리거
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- todos 테이블 updated_at 트리거
CREATE TRIGGER trigger_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES (보안 정책)
-- =====================================================

-- 6.1 users 테이블 정책

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT 
    USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트 가능
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    USING (auth.uid() = id);

-- 새 사용자 프로필 생성 허용 (회원가입 시)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 6.2 todos 테이블 정책

-- 사용자는 자신의 할 일만 조회 가능
CREATE POLICY "Users can view own todos" ON todos
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 생성 가능
CREATE POLICY "Users can insert own todos" ON todos
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 업데이트 가능
CREATE POLICY "Users can update own todos" ON todos
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 삭제 가능
CREATE POLICY "Users can delete own todos" ON todos
    FOR DELETE 
    USING (auth.uid() = user_id);

-- =====================================================
-- 7. VIEWS (뷰) 생성
-- =====================================================

-- 사용자별 할 일 통계 뷰
CREATE OR REPLACE VIEW user_todo_stats AS
SELECT 
    user_id,
    COUNT(*) as total_todos,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_todos,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_todos,
    COUNT(CASE WHEN status = 'pending' AND due_date < NOW() THEN 1 END) as overdue_todos,
    ROUND(
        (COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as completion_rate
FROM todos
GROUP BY user_id;

-- =====================================================
-- 8. FUNCTIONS (함수) 생성
-- =====================================================

-- 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 생성 시 프로필 자동 생성 트리거
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 9. SAMPLE DATA (개발용 샘플 데이터)
-- =====================================================

-- 주의: 프로덕션 환경에서는 이 섹션을 제거하세요

-- 샘플 사용자 (테스트용)
-- INSERT INTO users (id, email, name) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', '테스트 사용자');

-- 샘플 할 일 (테스트용)
-- INSERT INTO todos (user_id, title, description, due_date, status, priority) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'AI 할 일 관리 앱 완성', 'PRD를 바탕으로 기능 구현', NOW() + INTERVAL '2 days', 'pending', 1),
-- ('550e8400-e29b-41d4-a716-446655440000', '팀 회의 참석', '주간 스프린트 리뷰', NOW() + INTERVAL '1 day', 'pending', 2),
-- ('550e8400-e29b-41d4-a716-446655440000', '코드 리뷰', '동료 PR 검토', NOW() - INTERVAL '1 hour', 'completed', 2);

-- =====================================================
-- 스키마 생성 완료
-- =====================================================

-- 스키마 생성 확인 쿼리
SELECT 'AI 할 일 관리 데이터베이스 스키마가 성공적으로 생성되었습니다!' as message;
