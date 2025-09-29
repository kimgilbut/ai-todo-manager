# Supabase 설정 가이드

## 📁 파일 구조

```
lib/supabase/
├── server.ts      # 서버 컴포넌트용 클라이언트
├── client.ts      # 클라이언트 컴포넌트용 클라이언트
├── types.ts       # 데이터베이스 타입 정의
├── index.ts       # 통합 export
└── README.md      # 설정 가이드
```

## 🔧 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://tzcbcgelewkzatmtzosv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

> **주의**: 제공받은 키를 정확히 입력하세요. `sb_publishable_` 접두사가 포함된 전체 키를 사용하세요.

## 🚀 사용 방법

### 서버 컴포넌트에서 사용

```typescript
import { createServerClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = createServerClient()
  
  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    
  return (
    <div>
      {/* 서버에서 가져온 데이터 렌더링 */}
    </div>
  )
}
```

### 클라이언트 컴포넌트에서 사용

```typescript
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientComponent() {
  const [todos, setTodos] = useState([])
  const supabase = createBrowserClient()
  
  useEffect(() => {
    async function fetchTodos() {
      const { data } = await supabase
        .from('todos')
        .select('*')
      setTodos(data || [])
    }
    
    fetchTodos()
  }, [])
  
  return (
    <div>
      {/* 클라이언트에서 가져온 데이터 렌더링 */}
    </div>
  )
}
```

### 타입 안전성

```typescript
import { Todo, TodoInsert, TodoUpdate } from '@/lib/supabase'

// 타입 안전한 데이터 조작
const newTodo: TodoInsert = {
  user_id: 'user-id',
  title: '새로운 할 일',
  status: 'pending'
}

const updateData: TodoUpdate = {
  status: 'completed'
}
```

## 📊 데이터베이스 스키마

### users 테이블
- `id` (UUID, Primary Key)
- `email` (TEXT, UNIQUE, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

### todos 테이블
- `id` (UUID, Primary Key, DEFAULT uuid_generate_v4())
- `user_id` (UUID, Foreign Key → users.id)
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NULLABLE)
- `due_date` (TIMESTAMPTZ, NULLABLE)
- `status` (todo_status ENUM, DEFAULT 'pending')
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

## 🔒 Row Level Security (RLS)

Supabase에서 다음 RLS 정책을 설정해야 합니다:

```sql
-- users 테이블 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- todos 테이블 RLS 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 할 일만 접근 가능
CREATE POLICY "Users can access their own todos" ON todos
  FOR ALL USING (auth.uid() = user_id);

-- 사용자는 자신의 정보만 접근 가능
CREATE POLICY "Users can access their own profile" ON users
  FOR ALL USING (auth.uid() = id);
```
