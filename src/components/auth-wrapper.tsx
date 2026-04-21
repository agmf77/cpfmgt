
"use client"

import { useUser, useAuth } from "@/firebase"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { signOut } from "firebase/auth"
import { isOfflineUser } from "@/firebase/offline-auth"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isUserLoading) {
      const offlineMode = user && isOfflineUser(user);
      const isAnonymousFirebaseUser = user && !offlineMode && 'isAnonymous' in user && user.isAnonymous;

      if (!user && pathname !== "/login") {
        router.push("/login")
      } else if (user && isAnonymousFirebaseUser && pathname !== "/login") {
        // If the user requested to avoid anonymous, force logout if they are currently anonymous
        signOut(auth).then(() => {
          router.push("/login")
        })
      }
    }
  }, [user, isUserLoading, router, pathname, auth])

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Synchronizing Security Session...</p>
        </div>
      </div>
    )
  }

  // If on login page, just show it
  if (pathname === "/login") {
    return <>{children}</>
  }

  const isAnonymousFirebaseUser = user && !isOfflineUser(user) && 'isAnonymous' in user && user.isAnonymous;

  // If not logged in or anonymous (which is being phased out), show nothing while redirecting
  if (!user || isAnonymousFirebaseUser) {
    return null
  }

  return <>{children}</>
}
