import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export default async function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return <AppShell userName={profile.name}>{children}</AppShell>;
}
