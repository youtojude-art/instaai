"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithPassword } from "@/features/auth/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await signInWithPassword(formData);
          if (result?.error) {
            setError(result.error);
          }
        });
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium">メールアドレス</span>
        <Input name="email" type="email" autoComplete="email" required placeholder="example@company.jp" />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">パスワード</span>
        <Input name="password" type="password" autoComplete="current-password" required placeholder="パスワード" />
      </label>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? "ログイン中..." : "ログイン"}
      </Button>
    </form>
  );
}
