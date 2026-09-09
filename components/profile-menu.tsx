"use client"

import { useState, useTransition } from "react"
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react"

import { logoutAction } from "@/lib/actions/auth"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { sidebarMenuButtonVariants } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase() || "?"
}

type ProfileUser = { displayName: string; loginIdentifier: string; roleLabel: string }

export function ProfileMenu({
  user,
  variant = "header",
}: {
  user: ProfileUser
  variant?: "header" | "sidebar"
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
    })
  }

  const label = (
    <>
      <Avatar size={variant === "sidebar" ? "default" : "sm"}>
        <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-medium">{user.displayName}</span>
        <span className="text-muted-foreground text-xs">{user.roleLabel}</span>
      </div>
      {variant === "sidebar" && (
        <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
      )}
    </>
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            variant === "sidebar" ? (
              // A plain host <button> here, not the SidebarMenuButton
              // component — SidebarMenuButton doesn't forward the ref
              // DropdownMenuTrigger needs to position the menu (it never
              // threads an incoming ref into its own internal useRender()
              // call), which crashes the menu on open. A host element
              // always forwards refs correctly, so we replicate the look
              // with the same variant classes instead of nesting the
              // buggy wrapper.
              <button type="button" className={cn(sidebarMenuButtonVariants({ size: "lg" }))} />
            ) : (
              <Button variant="ghost" className="h-auto gap-2 px-2 py-1.5" />
            )
          }
        >
          {label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.displayName}</span>
              <span className="text-muted-foreground text-xs">{user.loginIdentifier}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <LogOutIcon />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu perlu login lagi untuk mengakses halaman ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} disabled={pending}>
              {pending ? "Memproses..." : "Ya, Keluar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
