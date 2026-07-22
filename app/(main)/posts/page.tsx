import Link from "next/link";
import { getContentPosts } from "@/features/posts/queries";

const statusLabels: Record<string, string> = {
  idea: "アイデア",
  planning: "企画中",
  staff_review: "事務確認中",
  approval_waiting: "承認待ち",
  approved: "承認済み",
  scheduled: "投稿予約済み",
  published: "投稿済み",
  on_hold: "保留",
  rejected: "却下"
};

export default async function PostsPage() {
  const posts = await getContentPosts();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">投稿管理</p>
        <h1 className="mt-1 text-2xl font-semibold">投稿一覧</h1>
      </div>

      <section className="rounded-lg border bg-white">
        <div className="grid grid-cols-[1.5fr_1fr_120px_120px] gap-4 border-b px-5 py-3 text-sm font-medium text-muted-foreground">
          <span>投稿タイトル</span>
          <span>案件</span>
          <span>形式</span>
          <span>ステータス</span>
        </div>
        <div className="divide-y">
          {posts.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              まだ投稿案がありません。AI社員チャットの返信から「投稿案として保存」を押してください。
            </p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="grid grid-cols-[1.5fr_1fr_120px_120px] gap-4 px-5 py-4 text-sm">
                <Link href={`/posts/${post.id}`} className="font-medium text-primary hover:underline">
                  {post.title}
                </Link>
                <span>{post.projects?.name ?? "-"}</span>
                <span>{post.content_type}</span>
                <span className="rounded-full bg-accent px-3 py-1 text-center text-xs font-medium text-accent-foreground">
                  {statusLabels[post.status] ?? post.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
