import { Navigate, Outlet } from "react-router"
import { useAuth } from "@/lib/queries"
import { TrainLoader } from "@/components/ui/train-loader"

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <TrainLoader size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
