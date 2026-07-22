import { getSupabaseEnvStatus } from "@/lib/env/supabase";

export default function SetupPage() {
  const status = getSupabaseEnvStatus();
  const isReadyForLogin = status.hasUrl && status.hasAnonKey;

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">初期設定</p>
          <h1 className="mt-2 text-2xl font-semibold">Supabaseの接続情報を設定してください</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            このアプリはログイン、案件保存、権限管理にSupabaseを使います。最初にSupabaseプロジェクトを作成し、
            接続情報を `.env.local` に入れる必要があります。
          </p>
        </div>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">{isReadyForLogin ? "ログイン準備ができています" : "次に必要なもの"}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isReadyForLogin
              ? "Supabaseの公開URLと公開キーが設定されています。次はSupabaseのSQL Editorで初期SQLを実行し、Authユーザーを作成してください。"
              : status.hasAnonKey
                ? "公開キーは設定済みです。残りはSupabaseのProject URLだけです。"
                : "SupabaseのProject URLとanon public keyを設定してください。"}
          </p>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">1. Supabaseで確認する場所</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Supabaseのプロジェクト画面を開き、Project Settings → API から Project URL と anon public key を確認します。
            service_role key は後続の管理機能で使うため、今は未設定でもログイン準備を進められます。
          </p>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">2. `.env.local` に入れる内容</h2>
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-white">
{`NEXT_PUBLIC_SUPABASE_URL=SupabaseのProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabaseのanon public key
SUPABASE_SERVICE_ROLE_KEY=後で管理機能を作るときに設定
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">
            `.env.local` はアプリの一番上の階層に作成します。
          </p>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">3. SupabaseにSQLを適用する</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            SupabaseのSQL Editorで `supabase/migrations/001_initial_auth_projects.sql` を実行します。
            続けて `supabase/migrations/002_project_context.sql`、`supabase/migrations/003_chat.sql`、
            `supabase/migrations/004_content_posts.sql` も実行します。
            これでユーザー、権限、案件、案件メンバー、ブランド、ターゲット、AI社員設定、チャット履歴、投稿管理が入ります。
          </p>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">4. 最初のユーザーを管理者にする</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            案件登録は管理者のみ実行できます。SupabaseのSQL Editorで、メールアドレスを自分のログインメールに置き換えて実行します。
          </p>
          <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-white">
{`insert into public.user_roles (user_id, role)
select id, 'admin'
from public.users
where email = 'あなたのメールアドレス'
on conflict do nothing;`}
          </pre>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">現在の設定状態</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <StatusRow label="NEXT_PUBLIC_SUPABASE_URL" ok={status.hasUrl} />
            <StatusRow label="NEXT_PUBLIC_SUPABASE_ANON_KEY" ok={status.hasAnonKey} />
            <StatusRow label="SUPABASE_SERVICE_ROLE_KEY" ok={status.hasServiceRoleKey} optional />
          </dl>
        </section>
      </div>
    </main>
  );
}

function StatusRow({ label, ok, optional = false }: { label: string; ok: boolean; optional?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <dt className="font-medium">{label}</dt>
      <dd className={ok ? "text-green-700" : optional ? "text-muted-foreground" : "text-red-700"}>
        {ok ? "設定済み" : optional ? "後で設定" : "未設定"}
      </dd>
    </div>
  );
}
