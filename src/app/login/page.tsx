"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@/firebase"
import { createOfflineAuthUser } from "@/firebase/offline-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Loader2, KeyRound, User, LogIn } from "lucide-react"
import { useSweetAlert } from "@/hooks/use-sweet-alert"

export default function LoginPage() {
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { showAlert } = useSweetAlert()

  const [idOrEmail, setIdOrEmail] = useState("arif")
  const [password, setPassword] = useState("123123")
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    createOfflineAuthUser()
    showAlert({
      title: "Offline Mode Enabled",
      description: `You are now using the app locally without Firebase access.`,
      type: "success"
    })
    router.push("/")
  }

  const handleForgotPassword = async () => {
    showAlert({
      title: "Offline Mode",
      description: "Password reset is unavailable in offline mode.",
      type: "info"
    })
  }

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 font-ledger">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Verifying Session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 font-ledger">
      <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden">
        <div className="h-2 bg-primary" />
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-3xl">
              <ShieldCheck className="size-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary uppercase">PBS CPF Management</CardTitle>
          <CardDescription>
            Authorized Personnel Only • Secure Terminal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="idOrEmail" className="text-xs font-bold uppercase tracking-wider text-slate-500">User ID or Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="idOrEmail" 
                  placeholder="Enter arif or email" 
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                  value={idOrEmail}
                  onChange={(e) => setIdOrEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 font-bold h-auto text-[10px] uppercase text-primary"
                  onClick={handleForgotPassword}
                  disabled={isResetting}
                >
                  {isResetting ? "Processing..." : "Reset Password"}
                </Button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <Button type="submit" className="w-full h-12 text-sm font-bold uppercase tracking-widest" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 size-4" />
                  Sign In to System
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full h-12 text-sm font-bold uppercase tracking-widest"
              onClick={() => {
                createOfflineAuthUser();
                router.push('/');
              }}
            >
              Continue Offline
            </Button>
            <div className="text-center pt-2">
              <p className="text-[16px] text-primary uppercase italic tracking-wider font-extrabold">
                Developed by: Ariful Islam,AGMF,Gazipur PBS-2
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
