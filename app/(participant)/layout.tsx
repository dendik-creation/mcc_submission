import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/session"
import { ProfileMenu } from "@/components/profile-menu"
import { RealtimeListener } from "@/components/realtime/realtime-listener"

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "participant") redirect("/login/peserta")

  return (
    <div className="min-h-svh">
      <RealtimeListener />
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-heading text-sm font-medium">Vibe Code Competition</span>
        <ProfileMenu user={{ ...user, roleLabel: "Peserta" }} />
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
