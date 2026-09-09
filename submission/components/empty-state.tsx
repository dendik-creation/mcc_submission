import type { LucideIcon } from "lucide-react"

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center ${className ?? ""}`}
    >
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <div className="flex flex-col gap-1 px-6">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}
