import { LegalPage } from "@/components/LegalPage"
import { termsConfig } from "./legal/terms.config"

export function TermsPage() {
  return <LegalPage config={termsConfig} />
}
