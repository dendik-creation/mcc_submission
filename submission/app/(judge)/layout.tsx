import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/session"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { RealtimeListener } from "@/components/realtime/realtime-listener"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== "judge") redirect("/login/juri")

  return (
    <SidebarProvider>
      <RealtimeListener showSubmissionToast />
      <AdminSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
