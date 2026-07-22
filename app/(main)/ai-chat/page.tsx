import Link from "next/link";
import { Bot, FolderKanban } from "lucide-react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatScrollAnchor } from "@/components/chat/chat-scroll-anchor";
import { SaveChatMessageButton } from "@/components/posts/save-chat-message-button";
import { getChatWorkspace } from "@/features/chat/queries";

type AiChatPageProps = {
  searchParams: Promise<{
    projectId?: string;
  }>;
};

export default async function AiChatPage({ searchParams }: AiChatPageProps) {
  const { projectId } = await searchParams;
  const { projects, selectedProjectId, workspace, messages } = await getChatWorkspace(projectId);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <div className="grid min-h-[calc(100vh-7rem)] grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_340px]">
      <aside className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">案件一覧</p>
          <FolderKanban className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-4 space-y-2">
          {projects.length === 0 ? (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              案件がありません。先に案件を登録してください。
            </div>
          ) : (
            projects.map((project) => {
              const active = project.id === selectedProjectId;
              return (
                <Link
                  key={project.id}
                  href={`/ai-chat?projectId=${project.id}`}
                  className={
                    active
                      ? "block rounded-md border border-primary bg-accent px-3 py-3 text-sm"
                      : "block rounded-md border px-3 py-3 text-sm hover:bg-muted"
                  }
                >
                  <span className="font-medium">{project.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {project.company_name ?? "会社名未設定"} / {project.industry ?? "業種未設定"}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex rounded-lg border bg-white">
        <div className="flex min-h-full w-full flex-col">
          <div className="border-b px-5 py-4">
            <p className="text-sm text-muted-foreground">選択中の案件</p>
            <h1 className="mt-1 font-semibold">{selectedProject?.name ?? "案件を選択してください"}</h1>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="max-w-[78%] rounded-lg bg-muted p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Bot className="h-4 w-4 text-primary" />
                  {workspace?.aiEmployee?.name ?? "AI社員"}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {selectedProject
                    ? "案件情報を読み込みました。投稿企画、文章作成、リール台本などを指示してください。"
                    : "左側から案件を選択すると、AI社員チャットを開始できます。"}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[78%] rounded-lg bg-primary p-4 text-primary-foreground"
                      : "max-w-[78%] rounded-lg bg-muted p-4"
                  }
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    {message.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : null}
                    {message.role === "user" ? "あなた" : workspace?.aiEmployee?.name ?? "AI社員"}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  {message.role === "assistant" ? <SaveChatMessageButton messageId={message.id} /> : null}
                </div>
              ))
            )}
            <ChatScrollAnchor messageCount={messages.length} />
          </div>

          <div className="border-t p-4">
            <ChatComposer selectedProjectId={selectedProjectId} disabled={!selectedProjectId} />
          </div>
        </div>
      </section>

      <aside className="rounded-lg border bg-white p-4">
        <p className="text-sm font-semibold">案件情報</p>
        {!workspace?.project ? (
          <p className="mt-4 text-sm text-muted-foreground">案件を選択してください。</p>
        ) : (
          <div className="mt-4 space-y-4 text-sm">
            <InfoBlock title="AI社員" value={workspace.aiEmployee?.name ?? "未設定"} />
            <InfoBlock title="ブランドトーン" value={workspace.brandProfile?.tone ?? "未設定"} />
            <InfoBlock title="ターゲット" value={workspace.targetProfile?.name ?? "未設定"} />
            <InfoBlock title="必須訴求" value={workspace.brandProfile?.required_appeals ?? "未設定"} />
            <InfoBlock title="NG表現" value={workspace.brandProfile?.prohibited_words ?? "未設定"} />
            <Link href={`/projects/${workspace.project.id}`} className="inline-flex text-sm font-medium text-primary hover:underline">
              案件詳細を編集
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 whitespace-pre-wrap leading-6">{value}</p>
    </div>
  );
}
