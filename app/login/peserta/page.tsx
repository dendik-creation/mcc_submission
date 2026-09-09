import Link from "next/link"

import { loginParticipantAction } from "@/lib/actions/auth"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ParticipantLoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login Peserta</CardTitle>
          <CardDescription>Masuk dengan nomor peserta dan password dari panitia.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            action={loginParticipantAction}
            identifierLabel="Nomor Peserta"
            identifierName="participantNumber"
            submitLabel="Masuk"
          />
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Juri/Admin?{" "}
            <Link href="/login/juri" className="underline">
              Login di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
