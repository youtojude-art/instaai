# API設計

## 基本方針

- 画面からの通常更新はServer Actionsを優先する。
- AI生成、ファイル処理、WebhookなどHTTP境界が必要なものはRoute Handlersを使う。
- すべての入力はZodで検証する。
- Server Action内で現在ユーザーを取得し、DB更新前に権限チェックを行う。
- RLSを有効化したSupabaseクライアントを原則使う。

## Server Actions

### 認証・ユーザー

- `inviteUser(input)`
- `updateUserRole(input)`
- `suspendUser(input)`
- `getCurrentUserProfile()`

### 案件

- `createProject(input)`
- `updateProject(projectId, input)`
- `archiveProject(projectId)`
- `addProjectMember(input)`
- `updateProjectMemberRole(input)`
- `removeProjectMember(input)`

### ブランド・ターゲット・商品サービス

- `upsertBrandProfile(projectId, input)`
- `upsertTargetProfile(projectId, input)`
- `createProduct(projectId, input)`
- `updateProduct(productId, input)`
- `createService(projectId, input)`
- `updateService(serviceId, input)`
- `upsertProjectRules(projectId, input)`

### AI社員

- `createAiEmployee(projectId, input)`
- `updateAiEmployee(aiEmployeeId, input)`
- `listAiEmployees(projectId)`

### 投稿

- `createContentPost(projectId, input)`
- `updateContentPost(postId, input)`
- `changeContentPostStatus(postId, status)`
- `duplicateContentPost(postId)`
- `createContentVersion(postId, input)`
- `addContentComment(postId, input)`

### 承認

- `requestApproval(postId, input)`
- `approveContent(postId, input)`
- `rejectContent(postId, input)`
- `requestRevision(postId, input)`

### タスク

- `createTask(projectId, input)`
- `updateTask(taskId, input)`
- `completeTask(taskId)`
- `createTasksFromPost(postId)`

### 素材

- `createAssetMetadata(projectId, input)`
- `updateAssetMetadata(assetId, input)`
- `markAssetStatus(assetId, status)`

### ナレッジ

- `createKnowledgeDocument(projectId, input)`
- `updateKnowledgeDocument(documentId, input)`
- `deleteKnowledgeDocument(documentId)`

### 実績・分析

- `upsertPostMetrics(postId, input)`
- `generateMonthlyReport(projectId, input)`
- `saveMonthlyReport(projectId, input)`

## Route Handlers

### AI

| パス | メソッド | 用途 |
| --- | --- | --- |
| `/api/ai/chat` | POST | AI社員チャット応答 |
| `/api/ai/generate/content-idea` | POST | 投稿企画生成 |
| `/api/ai/generate/carousel` | POST | フィード投稿生成 |
| `/api/ai/generate/reel` | POST | リール台本生成 |
| `/api/ai/generate/story` | POST | ストーリーズ生成 |
| `/api/ai/analyze/post-metrics` | POST | 投稿実績分析 |
| `/api/ai/embeddings/knowledge` | POST | ナレッジEmbedding作成 |

### ファイル

| パス | メソッド | 用途 |
| --- | --- | --- |
| `/api/assets/upload-url` | POST | Supabase Storageアップロード用URL発行 |
| `/api/knowledge/extract` | POST | 資料テキスト抽出 |

## 入力スキーマ例

```ts
export const createContentPostSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(120),
  contentType: z.enum(["carousel", "reel", "story", "image", "other"]),
  category: z.string().max(80).optional(),
  objective: z.string().max(240).optional(),
  status: z.enum([
    "idea",
    "planning",
    "ai_drafting",
    "staff_review",
    "waiting_assets",
    "designing",
    "review_waiting",
    "revising",
    "approval_waiting",
    "approved",
    "scheduled",
    "published",
    "on_hold",
    "rejected"
  ]),
  priority: z.enum(["low", "medium", "high"]),
  scheduledAt: z.string().datetime().optional(),
  caption: z.string().max(5000).optional(),
  cta: z.string().max(300).optional(),
  hashtags: z.array(z.string().max(80)).max(40).optional(),
  requiredAssets: z.array(z.string().max(120)).max(50).optional()
});
```

## エラーレスポンス方針

| 種別 | ステータス | 表示文言 |
| --- | --- | --- |
| 未ログイン | 401 | ログインが必要です |
| 権限不足 | 403 | この案件を操作する権限がありません |
| 入力不正 | 400 | 入力内容を確認してください |
| 対象なし | 404 | 対象データが見つかりません |
| AI生成失敗 | 422/500 | AI生成に失敗しました。条件を見直して再実行してください |

## 監査ログ

以下の操作は `audit_logs` に記録する。

- ログイン
- ユーザー招待、権限変更、停止
- 案件作成、更新、削除
- メンバー追加、削除
- 投稿作成、更新、ステータス変更
- 承認、却下、修正依頼
- ナレッジ登録、削除
- 素材登録、削除
- AI生成実行
