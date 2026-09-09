import Link from "next/link"

import { loginJudgeAction } from "@/lib/actions/auth"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function JudgeLoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login Juri/Admin</CardTitle>
          <CardDescription>Masuk dengan email dan password.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            action={loginJudgeAction}
            identifierLabel="Email"
            identifierName="email"
            identifierType="email"
            submitLabel="Masuk"
          />
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Peserta?{" "}
            <Link href="/login/peserta" className="underline">
              Login di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
