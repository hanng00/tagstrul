import type { ReactNode } from "react"
import { Helmet } from "react-helmet-async"
import { Logo } from "@/components/Logo"
import { ClaimRow } from "@/pages/home/ClaimRow"
import { WalletCard } from "@/pages/home/WalletCard"
import { TripRow } from "@/pages/ClaimAllPage"
import { MovingoCardView } from "@/pages/ProfilePage"
import { claims, delays, movingoCard } from "./fixtures"

const screens = [
  { title: "Hem, resor att kräva", src: "home?scenario=inbox" },
  { title: "Hem, allt krävt", src: "home?scenario=allClear" },
  { title: "Hem, ny användare", src: "home?scenario=newUser" },
  { title: "Kräv alla", src: "claim-all?scenario=inbox" },
  { title: "Kräv en resa", src: "claim/d1?scenario=inbox" },
  { title: "Pendlingar", src: "routes?scenario=inbox" },
  { title: "Profil", src: "profile?scenario=inbox" },
]

const colors = [
  { token: "background", use: "Sidans bakgrund" },
  { token: "card", use: "Kort och listor" },
  { token: "foreground", use: "Text" },
  { token: "muted-foreground", use: "Sekundär text" },
  { token: "border", use: "Linjer" },
  { token: "primary", use: "Huvudknapp, pengar" },
  { token: "primary-soft", use: "Bock, ikoner" },
  { token: "destructive", use: "Sen, inställd, fel" },
]

const pending = claims.filter((c) => c.status === "submitted")

/**
 * A living style guide: the real screens and components with sample data,
 * at /storybook, so design can be discussed from one link.
 */
export function StorybookPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Helmet>
        <title>Storybook | Tågstrul</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="section-padding mx-auto flex max-w-6xl items-center justify-between pt-8">
        <Logo size="small" />
        <a href="/" className="text-[15px] font-semibold text-primary">
          Till startsidan
        </a>
      </header>

      <main className="section-padding mx-auto max-w-6xl pt-10 pb-24">
        <h1 className="text-[40px] leading-[1.05] font-extrabold tracking-tight">Storybook</h1>
        <p className="mt-3 max-w-xl text-[17px] text-muted-foreground">
          Appens riktiga skärmar och komponenter med exempeldata. Inget här når SJ eller
          någons konto. Dela länken när ni pratar design.
        </p>

        <Section title="Skärmar" intro="Varje ram är appen som den ser ut på en telefon.">
          <div className="-mx-4 flex snap-x gap-6 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
            {screens.map((s) => (
              <figure key={s.src} className="shrink-0 snap-start">
                <div className="overflow-hidden rounded-[2rem] border-8 border-foreground/90 bg-background shadow-sm">
                  <iframe
                    title={s.title}
                    src={`/storybook/frame/${s.src}`}
                    width={390}
                    height={844}
                    className="block"
                    loading="lazy"
                  />
                </div>
                <figcaption className="mt-3 text-[15px] font-semibold">{s.title}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section title="Resor i inkorgen" intro="ClaimRow. Mest bråttom först, rött när det är 7 dagar kvar eller mindre.">
          <Specimen>
            <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
              <ClaimRow delay={delays.late42Urgent} />
              <ClaimRow delay={delays.cancelled} />
              <ClaimRow delay={delays.late24} />
            </div>
          </Specimen>
        </Section>

        <Section title="Skicka krav" intro="TripRow under Kräv alla: väntar, skickar, skickat, misslyckades.">
          <Specimen>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
              <TripRow delay={delays.late42Urgent} status={{ ok: true, result: { claimId: "x", confirmationId: "x", status: "submitted", submittedAt: "" } }} />
              <TripRow delay={delays.cancelled} status="sending" />
              <TripRow delay={delays.late24} status="waiting" />
              <TripRow delay={delays.late24} status={{ ok: false, reason: "missing-details", message: "Swish-nummer saknas" }} />
            </ul>
          </Specimen>
        </Section>

        <Section title="Pengar" intro="WalletCard. Det man fått tillbaka, mätt mot vad Movingo-kortet kostade.">
          <div className="grid gap-6 md:grid-cols-3">
            <Specimen caption="Början">
              <WalletCard totalReceived={85} totalPending={170} pendingClaims={pending} activeCard={movingoCard(20)} onClaimResolved={() => {}} />
            </Specimen>
            <Specimen caption="Nästan halvvägs">
              <WalletCard totalReceived={1240} totalPending={0} pendingClaims={[]} activeCard={movingoCard(20)} onClaimResolved={() => {}} />
            </Specimen>
            <Specimen caption="Kortet har betalat sig">
              <WalletCard totalReceived={2890} totalPending={0} pendingClaims={[]} activeCard={movingoCard(20)} onClaimResolved={() => {}} />
            </Specimen>
          </div>
        </Section>

        <Section title="Movingo-kort" intro="MovingoCardView. Påminner när kortet snart går ut.">
          <div className="grid gap-6 md:grid-cols-3">
            <Specimen caption="Giltigt">
              <MovingoCardView card={movingoCard(20)} onDelete={() => {}} />
            </Specimen>
            <Specimen caption="Går snart ut">
              <MovingoCardView card={movingoCard(3)} onDelete={() => {}} />
            </Specimen>
          </div>
        </Section>

        <Section title="Knappar" intro="En huvudknapp per skärm, i tumzonen.">
          <Specimen>
            <div className="flex flex-col gap-3">
              <button className="flex h-14 items-center justify-center rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground">
                Kräv alla tre, 297 kr
              </button>
              <button className="flex h-14 items-center justify-center rounded-2xl border border-border bg-card text-[17px] font-semibold">
                Lägg till pendling
              </button>
              <button className="flex h-11 items-center justify-center rounded-xl text-[15px] font-medium text-muted-foreground">
                Dölj resan, jag vill inte kräva den
              </button>
            </div>
          </Specimen>
        </Section>

        <Section title="Färger" intro="Lugn grund, en grön accent som används sparsamt, rött bara för förseningar och fel.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {colors.map((c) => (
              <div key={c.token} className="overflow-hidden rounded-2xl bg-card">
                <div className="h-20 border-b border-border" style={{ background: `var(--${c.token})` }} />
                <div className="p-3">
                  <p className="font-mono text-[13px]">--{c.token}</p>
                  <p className="text-[13px] text-muted-foreground">{c.use}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typografi" intro="Hanken Grotesk. Hierarki med storlek och vikt, inte färg.">
          <Specimen>
            <div className="space-y-4">
              <p className="text-[40px] leading-[1.05] font-extrabold tracking-tight">Allt krävt.</p>
              <p className="text-[34px] leading-[1.1] font-extrabold tracking-tight">3 resor att kräva</p>
              <p className="text-lg font-bold tracking-tight">Uppsala C – Stockholm C</p>
              <p className="text-[17px] text-muted-foreground">Sammanlagt 297 kr att hämta</p>
              <p className="text-[15px]">Brödtext och listor, 15 px.</p>
              <p className="text-[13px] text-muted-foreground">Hjälptext och detaljer, 13 px.</p>
            </div>
          </Specimen>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 mb-6 max-w-xl text-[15px] text-muted-foreground">{intro}</p>
      {children}
    </section>
  )
}

function Specimen({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <div className="max-w-sm">
      {caption && <p className="mb-2 text-[13px] text-muted-foreground">{caption}</p>}
      {children}
    </div>
  )
}
