-- =====================================================
-- AI 할 일 관리 웹 서비스 - 데이터베이스 스키마 업데이트
-- tags 컬럼 추가
-- =====================================================

-- todos 테이블에 tags 컬럼 추가
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- tags 컬럼에 대한 인덱스 생성 (배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_todos_tags ON todos USING GIN (tags);

-- tags 컬럼에 대한 RLS 정책은 기존 정책이 적용됨 (user_id 기반)

-- =====================================================
-- 업데이트 완료 확인
-- =====================================================

-- 스키마 업데이트 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'todos' 
AND column_name = 'tags';

-- 업데이트 완료 메시지
SELECT 'todos 테이블에 tags 컬럼이 성공적으로 추가되었습니다!' as message;
