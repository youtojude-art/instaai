# Vercel公開手順

この手順は、Instagram運用AI社員システムをローカル環境ではなくVercel上で公開するためのものです。

## 推奨構成

- アプリ本体: Vercel
- DB/Auth: Supabase
- AI生成: OpenAI API
- ドメイン: Vercel標準URLまたは独自ドメイン

## 事前確認

ローカルで以下が通ることを確認します。

```bash
pnpm typecheck
pnpm test
```

本番公開前に余裕があれば、開発サーバーを停止してから以下も確認します。

```bash
pnpm build
```

## GitHubにアップロード

VercelはGitHubリポジトリ連携が一番簡単です。

`.env.local` はGitHubに上げません。`.gitignore` で除外済みです。

上げてよいもの:

- アプリコード
- `supabase/migrations/*.sql`
- `.env.example`
- `docs/VERCEL_DEPLOY.md`

上げてはいけないもの:

- `.env`
- `.env.local`
- OpenAI APIキー
- Supabase service role keyの実値
- Supabase anon/publishable key以外の秘密情報

## Vercelプロジェクト作成

1. [Vercel](https://vercel.com/) にログイン
2. `Add New` -> `Project`
3. GitHubリポジトリを選択
4. Framework Preset は `Next.js`
5. Install Command は通常 `pnpm install`
6. Build Command は通常 `pnpm build`
7. Output Directory は未設定でOK

## Environment Variables

Vercelの Project Settings -> Environment Variables に以下を登録します。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_QUALITY=high
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

`NEXT_PUBLIC_APP_URL` は、Vercelで発行された本番URLまたは独自ドメインに置き換えます。

## Supabase Auth設定

Supabase管理画面で以下を設定します。

Authentication -> URL Configuration

Site URL:

```txt
https://your-app.vercel.app
```

Redirect URLs:

```txt
https://your-app.vercel.app/**
http://localhost:3000/**
```

独自ドメインを使う場合は、独自ドメインも追加します。

```txt
https://your-domain.example/**
```

## SQL適用

Supabase SQL Editorで、未実行のマイグレーションを順番に実行します。

```txt
supabase/migrations/001_initial_auth_projects.sql
supabase/migrations/002_project_context.sql
supabase/migrations/003_chat.sql
supabase/migrations/004_content_posts.sql
supabase/migrations/005_content_approvals.sql
supabase/migrations/006_post_metrics.sql
```

すでに実行済みのものは再実行しても基本的に壊れないよう `if not exists` や `drop policy if exists` を使っていますが、エラーが出た場合は全文を控えて確認します。

## 初回デプロイ

Vercelで `Deploy` を実行します。

成功後、発行されたURLで以下を確認します。

- ログインできる
- 案件一覧が表示される
- AIチャットが動く
- AIチャットの投稿案保存ができる
- 投稿一覧、投稿詳細が開ける
- 画像生成が動く
- 実績入力、月次レポートが開ける

## 独自ドメイン

Vercel Project Settings -> Domains から独自ドメインを追加します。

独自ドメインを使い始めたら、Supabaseの `Site URL` と `Redirect URLs` も独自ドメインに更新します。

## よくあるエラー

### ログイン後に戻ってこない

Supabaseの `Site URL` / `Redirect URLs` がVercelのURLと一致しているか確認します。

### OpenAI生成に失敗する

VercelのEnvironment Variablesに `OPENAI_API_KEY` が入っているか確認します。

画像生成の場合は以下も確認します。

```env
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_QUALITY=high
```

### Supabaseのデータが見えない

以下を確認します。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- RLSポリシー
- ログインユーザーが案件メンバーに入っているか

### Vercelでビルドエラーになる

ローカルで以下を実行して原因を確認します。

```bash
pnpm typecheck
pnpm test
pnpm build
```

