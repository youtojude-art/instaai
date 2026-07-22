"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertAiEmployee, upsertBrandProfile, upsertTargetProfile } from "@/features/project-context/actions";
import type { ProjectWorkspace } from "@/features/projects/queries";

type ProjectContextFormsProps = {
  projectId: string;
  workspace: ProjectWorkspace;
};

type FormState = {
  brand?: string;
  target?: string;
  ai?: string;
};

export function ProjectContextForms({ projectId, workspace }: ProjectContextFormsProps) {
  const [messages, setMessages] = useState<FormState>({});
  const [isPending, startTransition] = useTransition();
  const brand = workspace.brandProfile;
  const target = workspace.targetProfile;
  const aiEmployee = workspace.aiEmployee;
  const aiSettings = aiEmployee?.settings ?? {};

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <form
        className="space-y-4 rounded-lg border bg-white p-5"
        action={(formData) => {
          startTransition(async () => {
            const result = await upsertBrandProfile(formData);
            setMessages((current) => ({ ...current, brand: result.message }));
          });
        }}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <SectionHeader title="ブランド情報" description="投稿の雰囲気、NG表現、必須訴求をAI社員が参照します。" />
        <Field label="ブランドコンセプト">
          <Textarea name="concept" defaultValue={brand?.concept ?? ""} placeholder="例: 専門性はありつつ、初めての人にもやさしい発信" />
        </Field>
        <Field label="ブランドトーン">
          <Textarea name="tone" defaultValue={brand?.tone ?? ""} placeholder="例: 明るい、親しみやすい、押し売りしない" />
        </Field>
        <Field label="話し方">
          <Textarea name="speakingRules" defaultValue={brand?.speaking_rules ?? ""} placeholder="例: 敬語。短めの文で、専門用語は言い換える" />
        </Field>
        <Field label="必ず含める訴求">
          <Textarea name="requiredAppeals" defaultValue={brand?.required_appeals ?? ""} placeholder="例: LINE予約、無料相談、地域密着" />
        </Field>
        <Field label="使用してはいけない言葉">
          <Textarea name="prohibitedWords" defaultValue={brand?.prohibited_words ?? ""} placeholder="例: 絶対、必ず治る、業界No.1" />
        </Field>
        <Field label="法務・広告表現の注意">
          <Textarea name="legalNotes" defaultValue={brand?.legal_notes ?? ""} placeholder="例: 実績数値には根拠を添える" />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ブランドカラー">
            <Input name="colors" defaultValue={brand?.colors ?? ""} placeholder="例: ピンク、白、グレー" />
          </Field>
          <Field label="使用フォント">
            <Input name="fonts" defaultValue={brand?.fonts ?? ""} placeholder="例: Noto Sans JP" />
          </Field>
        </div>
        <FormFooter message={messages.brand} isPending={isPending} label="ブランドを保存" />
      </form>

      <form
        className="space-y-4 rounded-lg border bg-white p-5"
        action={(formData) => {
          startTransition(async () => {
            const result = await upsertTargetProfile(formData);
            setMessages((current) => ({ ...current, target: result.message }));
          });
        }}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <SectionHeader title="ターゲット情報" description="誰に向けて投稿するかをAI社員が判断する基礎情報です。" />
        <Field label="ターゲット名">
          <Input name="name" defaultValue={target?.name ?? "メインターゲット"} required />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="年齢">
            <Input name="ageRange" defaultValue={target?.age_range ?? ""} placeholder="例: 30代女性" />
          </Field>
          <Field label="性別">
            <Input name="gender" defaultValue={target?.gender ?? ""} placeholder="例: 女性" />
          </Field>
          <Field label="地域">
            <Input name="area" defaultValue={target?.area ?? ""} placeholder="例: 東京都内" />
          </Field>
          <Field label="職業">
            <Input name="occupation" defaultValue={target?.occupation ?? ""} placeholder="例: 会社員、主婦" />
          </Field>
        </div>
        <Field label="ライフスタイル">
          <Textarea name="lifestyle" defaultValue={target?.lifestyle ?? ""} placeholder="例: 平日は忙しく、休日に情報収集する" />
        </Field>
        <Field label="悩み">
          <Textarea name="pains" defaultValue={target?.pains ?? ""} placeholder="例: 何を選べばよいか分からない、失敗したくない" />
        </Field>
        <Field label="欲求">
          <Textarea name="desires" defaultValue={target?.desires ?? ""} placeholder="例: 信頼できる相手に相談したい、時短したい" />
        </Field>
        <Field label="行動してほしい内容">
          <Textarea name="behaviorNotes" defaultValue={target?.behavior_notes ?? ""} placeholder="例: LINE登録、予約、問い合わせ" />
        </Field>
        <FormFooter message={messages.target} isPending={isPending} label="ターゲットを保存" />
      </form>

      <form
        className="space-y-4 rounded-lg border bg-white p-5"
        action={(formData) => {
          startTransition(async () => {
            const result = await upsertAiEmployee(formData);
            setMessages((current) => ({ ...current, ai: result.message }));
          });
        }}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <SectionHeader title="AI社員設定" description="案件ごとの運用担当AIの性格、話し方、担当業務を設定します。" />
        <Field label="AI社員名">
          <Input name="name" defaultValue={aiEmployee?.name ?? "Instagram運用AI社員"} required />
        </Field>
        <Field label="性格">
          <Textarea name="personality" defaultValue={aiEmployee?.personality ?? ""} placeholder="例: 丁寧、前向き、実務的" />
        </Field>
        <Field label="話し方">
          <Textarea name="speakingStyle" defaultValue={aiEmployee?.speaking_style ?? ""} placeholder="例: 事務スタッフに分かりやすく、結論から話す" />
        </Field>
        <Field label="担当業務">
          <Textarea
            name="taskScope"
            defaultValue={(aiEmployee?.task_scope ?? ["投稿企画作成", "投稿文章作成", "リール台本作成", "投稿実績分析"]).join("\n")}
          />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField label="文章量" name="writingAmount" defaultValue={aiSettings.writingAmount ?? "medium"}>
            <option value="short">短め</option>
            <option value="medium">標準</option>
            <option value="long">詳しめ</option>
          </SelectField>
          <SelectField label="絵文字量" name="emojiAmount" defaultValue={aiSettings.emojiAmount ?? "low"}>
            <option value="none">なし</option>
            <option value="low">少なめ</option>
            <option value="medium">標準</option>
            <option value="high">多め</option>
          </SelectField>
          <SelectField label="セールス色" name="salesTone" defaultValue={aiSettings.salesTone ?? "medium"}>
            <option value="low">弱め</option>
            <option value="medium">標準</option>
            <option value="high">強め</option>
          </SelectField>
          <SelectField
            label="自主提案"
            name="proactiveSuggestions"
            defaultValue={aiSettings.proactiveSuggestions === false ? "false" : "true"}
          >
            <option value="true">あり</option>
            <option value="false">なし</option>
          </SelectField>
        </div>
        <FormFooter message={messages.ai} isPending={isPending} label="AI社員を保存" />
      </form>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
        {children}
      </select>
    </label>
  );
}

function FormFooter({ message, isPending, label }: { message?: string; isPending: boolean; label: string }) {
  return (
    <div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : label}
      </Button>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
