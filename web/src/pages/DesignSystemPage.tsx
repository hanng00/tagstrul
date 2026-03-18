import { useState } from "react"
import { Info, ChevronDown, Check, AlertCircle, ArrowLeft, Loader2, Bell, Settings, User, Plus, Trash2 } from "lucide-react"
import { TrainLoader } from "@/components/ui/train-loader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  )
}

function ComponentCard({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground mb-3">{name}</p>
      {children}
    </div>
  )
}

function ScheduledChangeWarning({ disruptionReason, defaultExpanded = false }: { disruptionReason?: string; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-950/20 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/30"
    >
      <div className="flex items-center gap-2">
        <Info className="size-4 shrink-0 text-amber-600/80 dark:text-amber-400/80" />
        <span className="flex-1 text-sm text-amber-800/90 dark:text-amber-200/90">
          Troligen planerad ändring
        </span>
        <ChevronDown 
          className={`size-4 text-amber-600/60 dark:text-amber-400/60 transition-transform ${expanded ? "rotate-180" : ""}`} 
        />
      </div>
      
      {expanded && (
        <div className="mt-2 pl-6 text-xs text-amber-700/80 dark:text-amber-300/80 space-y-2">
          <p>
            {disruptionReason ? `"${disruptionReason}" — ` : ""}
            Denna ändring meddelades mer än 72 timmar i förväg, vilket enligt SJ:s regler räknas som en tidtabellsändring snarare än en akut försening.
          </p>
          <p>
            Du kan fortfarande skicka in ansökan — SJ avgör slutgiltigt. Vid avslag har du rätt till återbetalning av biljetten.
          </p>
        </div>
      )}
    </button>
  )
}

export function DesignSystemPage() {
  const [switchOn, setSwitchOn] = useState(false)
  const [checked, setChecked] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Design System</h1>
        <p className="text-sm text-muted-foreground">Component showcase for tagstrul.se</p>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        
        {/* Loaders */}
        <Section title="Loaders">
          <div className="grid gap-4">
            <ComponentCard name="Train Loader (Default)">
              <div className="flex items-center justify-center py-8">
                <TrainLoader />
              </div>
            </ComponentCard>

            <ComponentCard name="Train Loader (Sizes)">
              <div className="flex items-center justify-center gap-8 py-8">
                <div className="flex flex-col items-center gap-2">
                  <TrainLoader size="sm" />
                  <span className="text-xs text-muted-foreground">Small</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <TrainLoader size="md" />
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <TrainLoader size="lg" />
                  <span className="text-xs text-muted-foreground">Large</span>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard name="Train Loader (With Text)">
              <div className="flex flex-col items-center justify-center gap-3 py-8">
                <TrainLoader size="md" />
                <p className="text-sm text-muted-foreground animate-pulse">Laddar...</p>
              </div>
            </ComponentCard>

            <ComponentCard name="Spinner (Generic)">
              <div className="flex items-center justify-center gap-4 py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            </ComponentCard>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="grid gap-4">
            <ComponentCard name="Variants">
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </ComponentCard>

            <ComponentCard name="Sizes">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </ComponentCard>

            <ComponentCard name="With Icons">
              <div className="flex flex-wrap gap-2">
                <Button><Plus className="size-4" /> Add</Button>
                <Button variant="outline"><Settings className="size-4" /> Settings</Button>
                <Button variant="destructive"><Trash2 className="size-4" /> Delete</Button>
                <Button variant="ghost" size="icon"><Bell className="size-4" /></Button>
              </div>
            </ComponentCard>

            <ComponentCard name="States">
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button disabled><Loader2 className="size-4 animate-spin" /> Loading</Button>
              </div>
            </ComponentCard>

            <ComponentCard name="App-style CTA">
              <Button className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90">
                <Check className="mr-2 size-4" />
                Bekräfta och fortsätt
              </Button>
            </ComponentCard>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <div className="grid gap-4">
            <ComponentCard name="Text Input">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Default</label>
                  <Input placeholder="Placeholder text" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">With value</label>
                  <Input defaultValue="hannes@example.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Disabled</label>
                  <Input disabled defaultValue="Disabled input" className="mt-1" />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard name="Switch">
              <div className="flex items-center gap-3">
                <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
                <span className="text-sm">{switchOn ? "On" : "Off"}</span>
              </div>
            </ComponentCard>

            <ComponentCard name="Checkbox">
              <label className="flex items-center gap-3">
                <Checkbox checked={checked} onCheckedChange={(c) => setChecked(c === true)} />
                <span className="text-sm">Accept terms and conditions</span>
              </label>
            </ComponentCard>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <ComponentCard name="Variants">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </ComponentCard>
        </Section>

        {/* Alerts & Warnings */}
        <Section title="Alerts & Warnings">
          <div className="grid gap-4">
            <ComponentCard name="Scheduled Change Warning (Collapsed)">
              <ScheduledChangeWarning />
            </ComponentCard>

            <ComponentCard name="Scheduled Change Warning (Expanded)">
              <ScheduledChangeWarning 
                disruptionReason="Banarbete" 
                defaultExpanded 
              />
            </ComponentCard>

            <ComponentCard name="Error State">
              <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <AlertCircle className="size-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">Något gick fel. Försök igen.</p>
              </div>
            </ComponentCard>

            <ComponentCard name="Success State">
              <div className="flex items-center gap-3 rounded-xl border border-money/20 bg-money-surface p-4">
                <Check className="size-5 shrink-0 text-money" />
                <p className="text-sm text-foreground">Ansökan skickad!</p>
              </div>
            </ComponentCard>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid gap-4">
            <ComponentCard name="Travel Card">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Steg 1: Bekräfta reseuppgifter
                </h2>
                <div className="mt-4 flex items-center gap-2 text-base font-medium text-foreground">
                  <span>Stockholm C</span>
                  <span className="text-muted-foreground">→</span>
                  <span>Göteborg C</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  tis 18 mars · avgång 08:15
                </p>
                <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                  <span className="text-sm text-destructive">45 min försening</span>
                  <span className="text-2xl font-semibold tabular-nums text-foreground">
                    ~150<span className="ml-0.5 text-sm font-medium text-muted-foreground">kr</span>
                  </span>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard name="Summary Card">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resa</span>
                    <span className="font-medium">Stockholm C → Göteborg C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Datum</span>
                    <span className="font-medium">tis 18 mars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Försening</span>
                    <span className="font-medium text-destructive">45 min</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Uppskattad ersättning</span>
                    <span className="text-lg font-semibold">~150 kr</span>
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>
        </Section>

        {/* Navigation */}
        <Section title="Navigation">
          <ComponentCard name="Header with Back Button">
            <header className="flex items-center gap-3">
              <button className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ArrowLeft className="size-5" />
              </button>
              <h1 className="text-lg font-semibold text-foreground">Begär ersättning</h1>
            </header>
          </ComponentCard>

          <ComponentCard name="Step Indicator">
            <div className="flex items-center justify-center gap-2 py-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= 1 ? "bg-foreground" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </ComponentCard>
        </Section>

        {/* Icons */}
        <Section title="Icons">
          <ComponentCard name="Common Icons">
            <div className="flex flex-wrap gap-4">
              {[
                { icon: ArrowLeft, name: "ArrowLeft" },
                { icon: Check, name: "Check" },
                { icon: AlertCircle, name: "AlertCircle" },
                { icon: Info, name: "Info" },
                { icon: ChevronDown, name: "ChevronDown" },
                { icon: Loader2, name: "Loader2" },
                { icon: Bell, name: "Bell" },
                { icon: Settings, name: "Settings" },
                { icon: User, name: "User" },
                { icon: Plus, name: "Plus" },
                { icon: Trash2, name: "Trash2" },
              ].map(({ icon: Icon, name }) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </ComponentCard>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <ComponentCard name="Headings & Text">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-foreground">Heading 1 (2xl bold)</h1>
              <h2 className="text-xl font-semibold text-foreground">Heading 2 (xl semibold)</h2>
              <h3 className="text-lg font-semibold text-foreground">Heading 3 (lg semibold)</h3>
              <p className="text-base text-foreground">Body text (base)</p>
              <p className="text-sm text-muted-foreground">Secondary text (sm muted)</p>
              <p className="text-xs text-muted-foreground">Caption text (xs muted)</p>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Section label (sm semibold uppercase tracking-wide)
              </p>
            </div>
          </ComponentCard>
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <ComponentCard name="Semantic Colors">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { name: "Background", class: "bg-background border" },
                { name: "Foreground", class: "bg-foreground" },
                { name: "Card", class: "bg-card border" },
                { name: "Muted", class: "bg-muted" },
                { name: "Primary", class: "bg-primary" },
                { name: "Secondary", class: "bg-secondary" },
                { name: "Destructive", class: "bg-destructive" },
                { name: "Border", class: "bg-border" },
              ].map(({ name, class: className }) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div className={`size-12 rounded-lg ${className}`} />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </ComponentCard>
        </Section>

      </main>
    </div>
  )
}
