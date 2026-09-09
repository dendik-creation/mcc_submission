import { CrownIcon, MedalIcon } from "lucide-react"

export type PodiumEntry = {
  participantId: string
  rank: number
  fullName?: string
  participantNumber?: string
  finalScore: number
}

const PODIUM_STYLE: Record<
  number,
  { order: string; height: string; ring: string; bar: string; icon: string }
> = {
  1: {
    order: "order-2",
    height: "h-36 sm:h-44",
    ring: "ring-amber-500/70",
    bar: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  2: {
    order: "order-1",
    height: "h-28 sm:h-34",
    ring: "ring-slate-400/70",
    bar: "bg-slate-400/15 text-slate-600 dark:text-slate-300",
    icon: "text-slate-400",
  },
  3: {
    order: "order-3",
    height: "h-20 sm:h-26",
    ring: "ring-orange-600/60",
    bar: "bg-orange-600/15 text-orange-700 dark:text-orange-400",
    icon: "text-orange-600",
  },
}

/** Kahoot-style top-3 podium. Ranks below 3 stay in the plain table. */
export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const top3 = entries.filter((entry) => entry.rank <= 3).sort((a, b) => a.rank - b.rank)
  if (top3.length === 0) return null

  return (
    <div className="flex items-end justify-center gap-4 pt-4 pb-2 sm:gap-8">
      {top3.map((entry) => {
        const style = PODIUM_STYLE[entry.rank]
        return (
          <div key={entry.participantId} className={`flex flex-col items-center gap-2 ${style.order}`}>
            <div
              className={`bg-background flex size-14 items-center justify-center rounded-full ring-4 ${style.ring}`}
            >
              {entry.rank === 1 ? (
                <CrownIcon className={`size-7 ${style.icon}`} />
              ) : (
                <MedalIcon className={`size-6 ${style.icon}`} />
              )}
            </div>
            <div className="max-w-24 text-center sm:max-w-32">
              <p className="truncate text-sm font-medium">{entry.fullName ?? entry.participantId}</p>
              {entry.participantNumber && (
                <p className="text-muted-foreground text-xs">{entry.participantNumber}</p>
              )}
              <p className="font-heading text-lg font-semibold">{entry.finalScore.toFixed(2)}</p>
            </div>
            <div
              className={`flex w-20 items-start justify-center rounded-t-lg pt-2 sm:w-28 ${style.height} ${style.bar}`}
            >
              <span className="font-heading text-3xl font-bold">{entry.rank}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
