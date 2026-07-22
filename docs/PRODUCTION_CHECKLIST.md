# 本番公開チェックリスト

Vercel公開前後に確認する項目です。

## 秘密情報

- [ ] `.env.local` をGitHubに上げていない
- [ ] OpenAI APIキーをチャットやREADMEに貼っていない
- [ ] Supabase service role keyを公開していない
- [ ] Vercel Environment Variablesにだけ本番キーを登録した

## Supabase

- [ ] `001_initial_auth_projects.sql` を実行済み
- [ ] `002_project_context.sql` を実行済み
- [ ] `003_chat.sql` を実行済み
- [ ] `004_content_posts.sql` を実行済み
- [ ] `005_content_approvals.sql` を実行済み
- [ ] `006_post_metrics.sql` を実行済み
- [ ] Supabase AuthのSite URLを本番URLに設定した
- [ ] Redirect URLsに本番URLとlocalhostを設定した

## Vercel

- [ ] GitHubリポジトリをVercelに接続した
- [ ] Framework PresetがNext.jsになっている
- [ ] `pnpm install` で依存関係をインストールする設定になっている
- [ ] `pnpm build` でビルドする設定になっている
- [ ] Environment VariablesをProductionに登録した
- [ ] デプロイが成功した

## 動作確認

- [ ] ログインできる
- [ ] 案件を作成・表示できる
- [ ] 案件詳細を編集できる
- [ ] AIチャットを送信できる
- [ ] AIチャットの返信を投稿案として保存できる
- [ ] 投稿一覧が表示される
- [ ] 投稿詳細が表示される
- [ ] 投稿カレンダーが表示される
- [ ] 承認フローが使える
- [ ] タスク管理が使える
- [ ] 投稿実績入力が使える
- [ ] 実績分析AIが使える
- [ ] 月次レポートが生成できる
- [ ] 投稿画像生成が使える

## 公開後

- [ ] 管理者以外のユーザーでログイン確認した
- [ ] 案件メンバー以外の案件が見えないことを確認した
- [ ] OpenAI API利用量を確認した
- [ ] Supabaseの利用量を確認した
- [ ] 独自ドメイン利用時はSupabase Redirect URLsを更新した
