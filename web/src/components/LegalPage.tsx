import { ArrowLeft } from "lucide-react"
import { useNavigate, Link } from "react-router"
import { Logo } from "@/components/Logo"
import { SEO } from "@/components/SEO"
import { BreadcrumbSchema } from "@/components/StructuredData"

type ListItem = string | { bold: string; text: string }

type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: ListItem[] }
  | { type: "card"; title: string; description: string; details?: { label: string; value: string }[] }

export interface LegalSection {
  title: string
  content: ContentBlock[]
}

export interface LegalPageConfig {
  title: string
  description: string
  canonical: string
  lastUpdated?: string
  sections: LegalSection[]
  footerLinks?: { label: string; to: string }[]
}

function renderListItem(item: ListItem, index: number) {
  if (typeof item === "string") {
    return <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
  }
  return (
    <li key={index}>
      <strong className="text-foreground">{item.bold}:</strong> {item.text}
    </li>
  )
}

function renderContentBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          key={index}
          className="mt-3"
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      )
    case "list":
      return (
        <ul key={index} className="mt-3 list-disc space-y-2 pl-5">
          {block.items.map(renderListItem)}
        </ul>
      )
    case "card":
      return (
        <div key={index} className="mt-4 rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">{block.title}</h3>
          <p className="mt-2 text-sm">{block.description}</p>
          {block.details && (
            <div className="mt-3 rounded bg-muted/50 p-3 text-xs">
              {block.details.map((d, i) => (
                <p key={i}>
                  <strong>{d.label}:</strong> {d.value}
                </p>
              ))}
            </div>
          )}
        </div>
      )
  }
}

export function LegalPage({ config }: { config: LegalPageConfig }) {
  const navigate = useNavigate()
  const lastUpdated = config.lastUpdated || new Date().toLocaleDateString("sv-SE")

  const defaultFooterLinks = [
    { label: "Integritetspolicy", to: "/integritet" },
    { label: "Användarvillkor", to: "/villkor" },
    { label: "Cookies", to: "/cookies" },
  ].filter((link) => link.to !== config.canonical)

  const footerLinks = config.footerLinks || defaultFooterLinks

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SEO
        title={config.title}
        description={config.description}
        canonical={config.canonical}
      />
      <BreadcrumbSchema
        items={[
          { name: "Hem", url: "/" },
          { name: config.title, url: config.canonical },
        ]}
      />

      <header className="flex items-center justify-between section-padding py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-auto sm:px-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Tillbaka</span>
        </button>
        <Logo size="small" />
      </header>

      <main className="flex-1 section-padding py-8">
        <article className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {config.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Senast uppdaterad: {lastUpdated}
          </p>

          <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
            {config.sections.map((section, sectionIndex) => (
              <section key={sectionIndex}>
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
                {section.content.map(renderContentBlock)}
              </section>
            ))}
          </div>
        </article>
      </main>

      <footer className="border-t border-border section-padding py-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Logo size="small" />
          <div className="flex items-center gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
