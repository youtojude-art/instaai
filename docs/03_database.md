# データベース設計

## 共通方針

- 主キーは原則 `uuid`。
- 各テーブルに `created_at`、`updated_at`、`deleted_at` を持たせる。
- 案件依存テーブルは `project_id` を必須にする。
- RLSを有効化し、案件メンバー以外は案件データを読めない。
- AI出力や可変情報は必要に応じて `jsonb` を使うが、検索や集計に使う項目は通常カラム化する。

## 共通カラム

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| id | uuid | yes | 主キー |
| created_at | timestamptz | yes | 作成日時 |
| updated_at | timestamptz | yes | 更新日時 |
| deleted_at | timestamptz | no | 論理削除日時 |

## 主要テーブル

### users

| カラム | 型 | 必須 | 制約 |
| --- | --- | --- | --- |
| id | uuid | yes | auth.users(id)参照 |
| email | text | yes | unique |
| name | text | yes |  |
| avatar_url | text | no |  |
| status | text | yes | active, invited, suspended |

インデックス: `email`, `status`

### user_roles

| カラム | 型 | 必須 | 制約 |
| --- | --- | --- | --- |
| user_id | uuid | yes | users(id)参照 |
| role | text | yes | admin, staff, reviewer, viewer |

一意制約: `user_id, role`

### projects

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| name | text | yes | 案件名 |
| company_name | text | no | 会社名 |
| shop_name | text | no | 店舗名 |
| industry | text | no | 業種 |
| website_url | text | no | Webサイト |
| location | text | no | 所在地 |
| business_hours | text | no | 営業時間 |
| phone | text | no | 電話番号 |
| reservation_url | text | no | 予約URL |
| line_url | text | no | LINE URL |
| inquiry_url | text | no | 問い合わせURL |
| status | text | yes | active, archived |

インデックス: `name`, `industry`, `status`

### instagram_accounts

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| project_id | uuid | yes | projects(id)参照 |
| account_name | text | yes | アカウント名 |
| username | text | yes | Instagramユーザー名 |
| url | text | no | Instagram URL |
| purpose | text[] | yes | 運用目的 |
| posting_frequency | text | no | 投稿頻度 |
| reference_accounts | text[] | no | 参考アカウント |
| competitor_accounts | text[] | no | 競合アカウント |

一意制約: `username`

### project_members

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| project_id | uuid | yes | projects(id)参照 |
| user_id | uuid | yes | users(id)参照 |
| project_role | text | yes | owner, operator, approver, viewer |

一意制約: `project_id, user_id`

### ai_employees

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| project_id | uuid | yes | projects(id)参照 |
| name | text | yes | AI社員名 |
| icon_url | text | no | アイコン |
| personality | text | no | 性格 |
| speaking_style | text | no | 話し方 |
| task_scope | text[] | yes | 担当業務 |
| settings | jsonb | yes | 提案積極性、文章量、絵文字量など |

### brand_profiles

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| project_id | uuid | yes | projects(id)参照、unique |
| concept | text | no | ブランドコンセプト |
| philosophy | text | no | 会社理念 |
| tone | text | no | ブランドトーン |
| speaking_rules | text | no | 話し方 |
| required_words | text[] | no | 使用したい言葉 |
| prohibited_words | text[] | no | 使用禁止 |
| required_appeals | text[] | no | 必須訴求 |
| ng_expressions | text[] | no | NG表現 |
| legal_notes | text | no | 法務注意 |
| colors | text[] | no | ブランドカラー |
| fonts | text[] | no | 使用フォント |

### target_profiles

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| project_id | uuid | yes | projects(id)参照 |
| name | text | yes | ターゲット名 |
| age_range | text | no | 年齢 |
| gender | text | no | 性別 |
| area | text | no | 地域 |
| occupation | text | no | 職業 |
| lifestyle | text | no | ライフスタイル |
| pains | text[] | no | 悩み |
| desires | text[] | no | 欲求 |
| behavior_notes | text | no | 行動特性 |

### products / services

商品とサービスは個別テーブルに分ける。共通して `project_id`, `name`, `price`, `features`, `strengths`, `faq`, `notes`, `priority` を持つ。

### project_rules

投稿ルール、NG表現、必須CTA、誇張表現ルール、投稿頻度、カテゴリを管理する。

### knowledge_documents / knowledge_chunks

`knowledge_documents` は資料メタデータ、`knowledge_chunks` はRAG用分割テキストとEmbeddingを管理する。

`knowledge_chunks.embedding` は `vector` 型を想定する。

### chat_threads / chat_messages

案件別、AI社員別の会話履歴を保存する。`chat_messages.content` は本文、`attachments` は `jsonb`。

### ai_memories

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| project_id | uuid | yes | projects(id)参照 |
| ai_employee_id | uuid | no | ai_employees(id)参照 |
| type | text | yes | revision_rule, approved_expression, rejected_expression, insight, caution |
| title | text | yes | 要約タイトル |
| content | text | yes | 記憶内容 |
| source_id | uuid | no | 元データ |
| importance | int | yes | 1-5 |

### content_posts

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| project_id | uuid | yes | projects(id)参照 |
| title | text | yes | 投稿タイトル |
| content_type | text | yes | carousel, reel, story, image, other |
| category | text | no | 投稿カテゴリ |
| objective | text | no | 投稿目的 |
| status | text | yes | idea等 |
| priority | text | yes | low, medium, high |
| scheduled_at | timestamptz | no | 投稿予定日時 |
| published_at | timestamptz | no | 投稿完了日時 |
| owner_id | uuid | no | users(id)参照 |
| reviewer_id | uuid | no | users(id)参照 |
| approver_id | uuid | no | users(id)参照 |
| caption | text | no | 投稿本文 |
| cta | text | no | CTA |
| hashtags | text[] | no | ハッシュタグ |
| required_assets | text[] | no | 必要素材 |
| instagram_url | text | no | 投稿URL |
| ai_payload | jsonb | no | AI生成元JSON |

インデックス: `project_id, status`, `project_id, scheduled_at`, `content_type`

### 関連制作テーブル

- `content_ideas`: 投稿企画
- `content_slides`: カルーセル各スライド
- `reel_scripts`: リール台本
- `reel_scenes`: リール各シーン
- `story_sets`: ストーリーズセット
- `story_items`: ストーリーズ各ページ
- `content_versions`: バージョン履歴
- `content_comments`: コメント
- `content_approvals`: 承認履歴

### content_tasks

投稿企画、素材依頼、デザイン、確認、投稿予約、数値入力などを管理する。

### uploaded_assets

写真、動画、ロゴ、資料などを管理する。Supabase Storageの `bucket`, `path`, `mime_type`, `size_bytes` を保存する。

### post_metrics

手動入力の実績値を保存する。`reach`, `impressions`, `likes`, `comments`, `saves`, `shares`, `video_views`, `profile_accesses`, `website_clicks`, `line_adds`, `inquiries`, `reservations`, `purchases`, `sales_amount` を持つ。

### monthly_reports

月次分析結果、改善提案、次月方針を保存する。

### notifications

アプリ内通知とメール通知の送信状態を保存する。

### prompt_templates

AI社員のプロンプトテンプレート、出力スキーマ種別、バージョンを管理する。

### usage_logs / audit_logs

AI使用量、主要操作、権限変更、削除、承認操作を記録する。

## RLSポリシー方針

### 共通ヘルパー

- `is_admin(user_id uuid)`: 全体adminか判定
- `is_project_member(project_id uuid, user_id uuid)`: 案件メンバーか判定
- `has_project_role(project_id uuid, user_id uuid, roles text[])`: 案件内ロール判定

### 読み取り

`admin` または対象 `project_id` のメンバーのみ許可。

### 作成・更新

- `owner`, `operator`: 制作系データを作成・更新可能
- `approver`: コメント、承認、却下、修正依頼が可能
- `viewer`: 更新不可

### 削除

物理削除は原則禁止。`owner` または `admin` のみ `deleted_at` 更新を許可。
