import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApprovalActionPanel } from "@/components/approvals/approval-action-panel";
import { PostImageGenerator } from "@/components/images/post-image-generator";
import { createDefaultImageDirection } from "@/features/images/prompt";
import { PostMetricPanel } from "@/components/metrics/post-metric-panel";
import { PostDetailForm } from "@/components/posts/post-detail-form";
import { PostStatusForm } from "@/components/posts/post-status-form";
import { PostTaskPanel } from "@/components/tasks/post-task-panel";
import { getMetricPostOptions, getPostMetric } from "@/features/metrics/queries";
import { getContentPostDetail } from "@/features/posts/queries";
import { getDashboardProjects } from "@/features/projects/queries";
import { getPostTasks, getTaskPostOptions } from "@/features/tasks/queries";

type PostDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const [{ post, versions, approvals }, projects, taskPosts, tasks, metricPosts, metric] = await Promise.all([
    getContentPostDetail(postId),
    getDashboardProjects(),
    getTaskPostOptions(),
    getPostTasks(postId),
    getMetricPostOptions(),
    getPostMetric(postId)
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/posts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          投稿一覧へ戻る
        </Link>
        <p className="mt-4 text-sm font-medium text-primary">投稿詳細</p>
        <h1 className="mt-1 text-2xl font-semibold">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{post.projects?.name ?? "案件未設定"}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <PostDetailForm post={post} />
          <PostImageGenerator postId={post.id} defaultPrompt={createDefaultImageDirection(post)} />
          <PostTaskPanel post={post} projects={projects} posts={taskPosts} tasks={tasks} />
          <PostMetricPanel post={post} posts={metricPosts} metric={metric} />
        </div>
        <aside className="space-y-4">
          <ApprovalActionPanel postId={post.id} status={post.status} approvals={approvals} />
          <PostStatusForm postId={post.id} status={post.status} />
          <section className="rounded-lg border bg-white p-5">
            <h2 className="font-semibold">バージョン履歴</h2>
            <div className="mt-4 space-y-3 text-sm">
              {versions.map((version) => (
                <div key={version.id} className="rounded-md border p-3">
                  <p className="font-medium">v{version.version_number}: {version.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{version.change_note ?? "変更メモなし"}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
