# アーキテクチャ設計

## 技術構成

| 領域 | 採用技術 |
| --- | --- |
| フロントエンド | Next.js App Router、TypeScript、Tailwind CSS、shadcn/ui |
| フォーム | React Hook Form、Zod |
| バックエンド | Next.js Server Actions、Route Handlers |
| 認証 | Supabase Auth |
| DB | Supabase PostgreSQL |
| ストレージ | Supabase Storage |
| AI | OpenAI API、Structured Outputs、Embeddings、RAG |
| デプロイ | Vercel、Supabase |
| テスト | Vitest、React Testing Library、Playwright |

## ディレクトリ構成

```text
.
├── app
│   ├── (auth)
│   │   ├── login
│   │   └── reset-password
│   ├── (main)
│   │   ├── dashboard
│   │   ├── ai-chat
│   │   ├── projects
│   │   ├── posts
│   │   ├── calendar
│   │   ├── tasks
│   │   ├── approvals
│   │   ├── assets
│   │   ├── knowledge
│   │   ├── analytics
│   │   ├── notifications
│   │   └── settings
│   ├── api
│   │   ├── ai
│   │   ├── assets
│   │   └── webhooks
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── app
│   ├── auth
│   ├── chat
│   ├── dashboard
│   ├── forms
│   ├── posts
│   ├── shared
│   └── ui
├── features
│   ├── ai
│   ├── analytics
│   ├── approvals
│   ├── assets
│   ├── auth
│   ├── calendar
│   ├── chat
│   ├── knowledge
│   ├── notifications
│   ├── posts
│   ├── projects
│   ├── tasks
│   └── users
├── lib
│   ├── ai
│   ├── auth
│   ├── permissions
│   ├── supabase
│   ├── validations
│   └── utils
├── supabase
│   ├── migrations
│   ├── seed.sql
│   └── rls
├── tests
│   ├── e2e
│   ├── integration
│   └── unit
└── docs
```

## 権限設計

### 全体ロール

| ロール | 説明 |
| --- | --- |
| admin | 全ユーザー、全案件、全設定を管理できる |
| staff | 自分が参加している案件の制作・運用を行える |
| reviewer | 自分が確認者として参加している案件を確認できる |
| viewer | 自分に許可された案件を閲覧できる |

### 案件内ロール

| 案件内ロール | 主な権限 |
| --- | --- |
| owner | 案件設定、メンバー、AI社員、投稿、分析を管理できる |
| operator | 投稿作成、編集、タスク、素材、実績入力ができる |
| approver | 投稿の確認、コメント、承認、却下ができる |
| viewer | 閲覧のみできる |

## アクセス制御方針

- すべての案件依存データは `project_id` を持つ。
- 管理者は全案件へアクセスできる。
- 管理者以外は `project_members` に紐付く案件のみアクセスできる。
- 書き込み権限は案件内ロールに応じて制御する。
- UI上の制御だけでなく、Server Actions、Route Handlers、RLSで必ず検証する。

## セキュリティ方針

- APIキーはサーバー側環境変数のみで扱う。
- 入力値はZodで検証する。
- HTML表示はエスケープし、MarkdownやAI出力は危険タグを除去する。
- ファイルアップロードはMIMEタイプ、拡張子、サイズを検証する。
- ナレッジ内の命令文はシステム指示として扱わない。
- 操作履歴を `audit_logs` に保存する。
- 削除は論理削除を基本とし、UIで確認を挟む。
- AI生成APIにはレート制限を入れる。
