import { LegalPage } from "@/components/LegalPage"
import { cookiesConfig } from "./legal/cookies.config"

export function CookiePage() {
  return <LegalPage config={cookiesConfig} />
}
