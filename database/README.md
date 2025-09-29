# AI 할 일 관리 - 데이터베이스 설정 가이드

## 📁 파일 구조

```
database/
├── schema.sql     # 메인 데이터베이스 스키마
├── seed.sql       # 개발용 시드 데이터
└── README.md      # 설정 가이드
```

## 🗄️ 데이터베이스 설정

### 1️⃣ **Supabase 프로젝트 설정**

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. SQL Editor로 이동

### 2️⃣ **스키마 생성**

SQL Editor에서 `schema.sql` 파일의 내용을 복사하여 실행:

```sql
-- schema.sql 파일의 전체 내용을 복사하여 실행
```

실행 순서:
1. 확장 기능 및 ENUM 생성
2. 테이블 생성 (users, todos)
3. 인덱스 생성
4. 트리거 및 함수 생성
5. RLS 정책 설정

### 3️⃣ **개발용 시드 데이터 (선택사항)**

개발 환경에서만 `seed.sql` 실행:

```sql
-- seed.sql 파일의 내용을 복사하여 실행 (개발 환경만)
```

> ⚠️ **주의**: 프로덕션 환경에서는 시드 데이터를 실행하지 마세요.

## 🏗️ 데이터베이스 구조

### 📊 **ERD (Entity Relationship Diagram)**

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │     todos       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │───────│ user_id (FK)    │
│ email           │    1:N│ id (PK)         │
│ name            │       │ title           │
│ avatar_url      │       │ description     │
│ created_at      │       │ due_date        │
│ updated_at      │       │ status          │
└─────────────────┘       │ priority        │
                          │ created_at      │
                          │ updated_at      │
                          └─────────────────┘
```

### 🔐 **RLS (Row Level Security) 정책**

#### users 테이블
- `Users can view own profile`: 사용자는 자신의 프로필만 조회
- `Users can update own profile`: 사용자는 자신의 프로필만 수정
- `Users can insert own profile`: 새 사용자 프로필 생성 허용

#### todos 테이블
- `Users can view own todos`: 사용자는 자신의 할 일만 조회
- `Users can insert own todos`: 사용자는 자신의 할 일만 생성
- `Users can update own todos`: 사용자는 자신의 할 일만 수정
- `Users can delete own todos`: 사용자는 자신의 할 일만 삭제

## 📈 **성능 최적화**

### 인덱스 구성

```sql
-- 기본 조회 최적화
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_user_created_at ON todos(user_id, created_at DESC);

-- 필터링 최적화
CREATE INDEX idx_todos_user_status ON todos(user_id, status);
CREATE INDEX idx_todos_user_due_date ON todos(user_id, due_date);
CREATE INDEX idx_todos_user_priority ON todos(user_id, priority);

-- 마감일 기반 조회 최적화
CREATE INDEX idx_todos_status_due_date ON todos(status, due_date) WHERE due_date IS NOT NULL;
```

### 쿼리 최적화 팁

1. **사용자별 할 일 조회**
   ```sql
   SELECT * FROM todos 
   WHERE user_id = $1 
   ORDER BY created_at DESC;
   ```

2. **상태별 필터링**
   ```sql
   SELECT * FROM todos 
   WHERE user_id = $1 AND status = $2
   ORDER BY due_date ASC NULLS LAST;
   ```

3. **우선순위별 정렬**
   ```sql
   SELECT * FROM todos 
   WHERE user_id = $1 
   ORDER BY priority ASC, due_date ASC NULLS LAST;
   ```

## 🔧 **데이터베이스 함수**

### 사용자 통계 뷰

```sql
-- 사용자별 할 일 통계 조회
SELECT * FROM user_todo_stats WHERE user_id = $1;
```

결과 예시:
```json
{
  "user_id": "uuid",
  "total_todos": 10,
  "completed_todos": 7,
  "pending_todos": 3,
  "overdue_todos": 1,
  "completion_rate": 70.00
}
```

### 자동 사용자 프로필 생성

새 사용자가 Supabase Auth에 가입하면 자동으로 `users` 테이블에 프로필이 생성됩니다.

## 🚀 **배포 시 체크리스트**

### 프로덕션 배포 전 확인사항

- [ ] RLS 정책이 모든 테이블에 활성화되어 있는지 확인
- [ ] 시드 데이터가 제거되었는지 확인
- [ ] 인덱스가 올바르게 생성되었는지 확인
- [ ] 외래키 제약조건이 설정되었는지 확인
- [ ] 백업 정책이 설정되었는지 확인

### 환경별 설정

#### 개발 환경
- 시드 데이터 포함
- 로깅 활성화
- 성능 모니터링 설정

#### 프로덕션 환경
- 시드 데이터 제외
- 보안 정책 강화
- 백업 및 모니터링 설정

## 📝 **마이그레이션**

### 스키마 변경 시

1. 새로운 마이그레이션 파일 생성
2. 변경사항 적용
3. 인덱스 재생성 (필요시)
4. RLS 정책 업데이트 (필요시)

### 버전 관리

```
migrations/
├── 001_initial_schema.sql
├── 002_add_priority_column.sql
└── 003_add_user_stats_view.sql
```

## 🔍 **모니터링 쿼리**

### 데이터베이스 상태 확인

```sql
-- 테이블별 행 수 확인
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables;

-- 인덱스 사용률 확인
SELECT 
  indexrelname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes;
```

## 🆘 **문제 해결**

### 자주 발생하는 문제

1. **RLS 정책 오류**
   - 해결: 사용자가 올바른 권한을 가지고 있는지 확인

2. **성능 저하**
   - 해결: 쿼리 실행 계획 확인 및 인덱스 최적화

3. **외래키 제약조건 위반**
   - 해결: 참조 무결성 확인

---

데이터베이스 설정이 완료되면 Next.js 애플리케이션에서 타입 안전한 데이터베이스 연동이 가능합니다! 🎯
