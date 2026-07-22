# Instagram運用AI社員システム 設計ドキュメント

このディレクトリは、自社専用Instagram運用AI社員システムのMVP開発に入る前の設計資料です。

## ドキュメント構成

- [01_requirements.md](./01_requirements.md): 要件整理、MVP機能一覧、利用者別業務フロー、ユーザーフロー、画面一覧
- [02_architecture.md](./02_architecture.md): 技術構成、ディレクトリ構成、権限設計、セキュリティ方針
- [03_database.md](./03_database.md): Supabase/PostgreSQLデータベース設計、RLS方針、主要テーブル定義
- [04_api.md](./04_api.md): Server Actions、Route Handlers、入力検証、API設計
- [05_ai.md](./05_ai.md): AI社員、プロンプト、Structured Outputs、記憶、RAG設計
- [06_development_plan.md](./06_development_plan.md): 開発フェーズ、実装順序、タスク一覧、テスト方針
- [USER_MANUAL.md](./USER_MANUAL.md): 公開後のログイン、案件登録、AIチャット、投稿管理、承認、実績入力、月次レポートの操作マニュアル

## MVPの開発方針

MVPでは、外部販売用SaaSではなく社内業務システムとして、以下を優先します。

1. Supabase AuthとRLSによる案件別アクセス制御
2. 案件、ブランド、ターゲット、AI社員の管理
3. AI社員チャットと会話履歴保存
4. 投稿企画、フィード、リール、ストーリーズ生成
5. 投稿、タスク、素材、承認、実績、分析の基本管理
6. 操作履歴と最低限のセキュリティ対策

Instagram自動投稿、Instagram Graph API、Canva連携、画像・動画自動生成、Slack/LINE通知はMVP後に追加します。
