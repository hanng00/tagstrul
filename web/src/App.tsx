import { BrowserRouter, Routes, Route } from "react-router"
import { AuthProvider } from "@/components/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { AppLayout } from "@/components/AppLayout"
import { HomePage } from "@/pages/HomePage"
import { ClaimPage } from "@/pages/ClaimPage"
import { RoutesPage } from "@/pages/RoutesPage"
import { ProfilePage } from "@/pages/ProfilePage"

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="claim/:delayId" element={<ClaimPage />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
