import { getActiveCompetition } from "@/lib/db/queries"
import { RotateTokenButton } from "@/components/admin/rotate-token-button"
import { SettingsForm } from "@/components/admin/settings-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SettingsPage() {
  const competition = await getActiveCompetition()
  if (!competition) {
    return <p className="text-destructive">Lomba belum dikonfigurasi.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Lomba</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            name={competition.name}
            scheduledStartAt={competition.scheduledStartAt}
            scheduledEndAt={competition.scheduledEndAt}
            timerThresholdSeconds={competition.timerThresholdSeconds}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>URL Live Board (Proyektor)</CardTitle>
        </CardHeader>
        <CardContent>
          <RotateTokenButton currentToken={competition.projectorToken} />
        </CardContent>
      </Card>
    </div>
  )
}
