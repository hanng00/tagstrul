/** Who handles a claim for a delayed train. Mirrors backend/src/domain/claims.ts. */
export interface ClaimProvider {
  id: "sj" | "malardalstrafik"
  name: string
  /** Possessive form, e.g. "SJ:s" */
  possessive: string
  termsUrl: string
  manualClaimUrl: string
  manualClaimLabel: string
}

const SJ: ClaimProvider = {
  id: "sj",
  name: "SJ",
  possessive: "SJ:s",
  termsUrl: "https://www.sj.se/om-sj/regler-och-villkor/rattigheter-vid-forsening#Ers%C3%A4ttning_vid_f%C3%B6rsening",
  manualClaimUrl: "https://www.sj.se/kundservice/forseningsersattning",
  manualClaimLabel: "SJ.se",
}

const MALARDALSTRAFIK: ClaimProvider = {
  id: "malardalstrafik",
  name: "Mälardalstrafik",
  possessive: "Mälardalstrafiks",
  termsUrl: "https://www.malardalstrafik.se/kundservice/ersaettning-vid-foersening/",
  manualClaimUrl: "https://evf-regionsormland.preciocloudapp.net/trains/evf",
  manualClaimLabel: "Mälardalstrafiks ansökan",
}

/** Mälartåg trains are claimed with Mälardalstrafik, everything else with SJ. */
export function claimProviderFor(operator: string | undefined): ClaimProvider {
  return operator === "malartag" ? MALARDALSTRAFIK : SJ
}
