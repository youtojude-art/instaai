import Link from "next/link";
import { BarChart3, CalendarDays, CheckSquare, FileText, ListChecks, LogOut, MessageSquareText, LayoutDashboard, FolderKanban, Settings, Newspaper } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/projects", label: "案件一覧", icon: FolderKanban },
  { href: "/ai-chat", label: "AI社員チャット", icon: MessageSquareText },
  { href: "/posts", label: "投稿一覧", icon: Newspaper },
  { href: "/calendar", label: "投稿カレンダー", icon: CalendarDays },
  { href: "/approvals", label: "承認フロー", icon: CheckSquare },
  { href: "/tasks", label: "タスク管理", icon: ListChecks },
  { href: "/metrics", label: "投稿実績入力", icon: BarChart3 },
  { href: "/reports", label: "月次レポート", icon: FileText },
  { href: "/setup", label: "初期設定", icon: Settings }
];

type AppShellProps = {
  userName: string;
  children: React.ReactNode;
};

export function AppShell({ userName, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white lg:block">
        <div className="border-b px-5 py-5">
          <p className="text-sm font-medium text-primary">Instagram運用</p>
          <p className="mt-1 font-semibold">AI社員システム</p>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold lg:hidden">AI社員システム</p>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">ログイン中: {userName}</p>
            </div>
          <form action={signOut}>
            <Button variant="secondary" type="submit" className="h-9 gap-2 px-3 sm:h-10 sm:px-4">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </Button>
          </form>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t px-3 py-2 lg:hidden">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium hover:bg-muted"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
