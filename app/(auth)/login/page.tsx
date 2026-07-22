import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-6 py-10">
      <section className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Instagram運用AI社員</p>
          <h1 className="mt-2 text-2xl font-semibold">ログイン</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            登録済みのメールアドレスとパスワードを入力してください。
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
