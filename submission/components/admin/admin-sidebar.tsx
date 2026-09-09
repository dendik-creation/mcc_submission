"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardCheckIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react"

import { ProfileMenu } from "@/components/profile-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/admin/participants", label: "Peserta", icon: UsersIcon },
  { href: "/admin/submissions", label: "Submission", icon: FileTextIcon },
  { href: "/admin/scoring", label: "Penilaian", icon: ClipboardCheckIcon },
  { href: "/admin/results", label: "Hasil", icon: TrophyIcon },
  { href: "/admin/settings", label: "Pengaturan", icon: SettingsIcon },
]

export function AdminSidebar({
  user,
}: {
  user: { displayName: string; loginIdentifier: string }
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="bg-primary text-primary-foreground font-heading flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
            MC
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">MCC 2026</span>
            <span className="text-muted-foreground text-xs">Operations</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ProfileMenu user={{ ...user, roleLabel: "Juri/Admin" }} variant="sidebar" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
