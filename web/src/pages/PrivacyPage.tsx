import { LegalPage } from "@/components/LegalPage"
import { privacyConfig } from "./legal/privacy.config"

export function PrivacyPage() {
  return <LegalPage config={privacyConfig} />
}
