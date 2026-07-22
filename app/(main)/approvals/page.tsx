import Link from "next/link";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { getApprovalQueuePosts } from "@/features/approvals/queries";

const statusLabels: Record<string, string> = {
  approval_waiting: "承認待ち",
  approved: "承認済み",
  rejected: "差し戻し"
};

const statusIcons: Record<string, React.ReactNode> = {
  approval_waiting: <Clock3 className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />
};

export default async function ApprovalsPage() {
  const posts = await getApprovalQueuePosts();
  const waitingPosts = posts.filter((post) => post.status === "approval_waiting");
  const recentPosts = posts.filter((post) => post.status !== "approval_waiting");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">承認管理</p>
        <h1 className="mt-1 text-2xl font-semibold">承認フロー</h1>
        <p className="mt-2 text-sm text-muted-foreground">承認待ちの投稿と、直近の承認・差し戻し済み投稿を確認できます。</p>
      </div>

      <section className="rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">承認待ち</h2>
        </div>
        <ApprovalRows posts={waitingPosts} emptyMessage="現在、承認待ちの投稿はありません。" />
      </section>

      <section className="rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">最近の承認結果</h2>
        </div>
        <ApprovalRows posts={recentPosts} emptyMessage="まだ承認・差し戻し済みの投稿はありません。" />
      </section>
    </div>
  );
}

function ApprovalRows({
  posts,
  emptyMessage
}: {
  posts: Awaited<ReturnType<typeof getApprovalQueuePosts>>;
  emptyMessage: string;
}) {
  if (posts.length === 0) {
    return <p className="px-5 py-8 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y">
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`} className="grid gap-3 px-5 py-4 text-sm hover:bg-muted/50 md:grid-cols-[1.5fr_1fr_150px_150px]">
          <span>
            <span className="block font-medium text-primary">{post.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{post.content_type}</span>
          </span>
          <span>{post.projects?.name ?? "案件未設定"}</span>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            {statusIcons[post.status]}
            {statusLabels[post.status] ?? post.status}
          </span>
          <span className="text-muted-foreground">{post.scheduled_at ? formatDateTime(post.scheduled_at) : "予定未設定"}</span>
        </Link>
      ))}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
