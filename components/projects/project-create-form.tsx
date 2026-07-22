"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject } from "@/features/projects/actions";

export function ProjectCreateForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-2"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await createProject(formData);
          setMessage(result.message);
        });
      }}
    >
      <label className="space-y-2">
        <span className="text-sm font-medium">案件名</span>
        <Input name="name" required placeholder="例: 自社広報アカウント" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">会社名</span>
        <Input name="companyName" placeholder="例: 株式会社サンプル" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">店舗名</span>
        <Input name="shopName" placeholder="例: 表参道店" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">業種</span>
        <Input name="industry" placeholder="例: 美容室" />
      </label>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "登録中..." : "案件を登録"}
        </Button>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
