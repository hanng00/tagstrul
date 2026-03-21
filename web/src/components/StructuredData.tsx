import { Helmet } from "react-helmet-async"

const SITE_URL = "https://tagstrul.se"

interface OrganizationSchemaProps {
  name?: string
  url?: string
  logo?: string
  description?: string
}

export function OrganizationSchema({
  name = "Tågstrul",
  url = SITE_URL,
  logo = `${SITE_URL}/icon-512.svg`,
  description = "Tågstrul hjälper Movingo-pendlare i Mälardalen att få ersättning vid tågförseningar. Vi bevakar dina resor automatiskt och gör det enkelt att kräva tillbaka pengar.",
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    foundingDate: "2024",
    areaServed: {
      "@type": "Country",
      name: "Sweden",
    },
    serviceType: "Train delay compensation service",
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tågstrul",
    url: SITE_URL,
    description:
      "Ersättning för Movingo-pendlare vid tågförseningar. Vi bevakar dina Mälartåg-resor automatiskt.",
    inLanguage: "sv-SE",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}

interface FAQItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  items: FAQItem[]
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tågstrul",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SEK",
    },
    description:
      "Automatisk bevakning av tågförseningar för Movingo-pendlare. Få ersättning vid förseningar på Mälartåg.",
    featureList: [
      "Automatisk förseningsbevakning",
      "Ersättningsberäkning för Movingo-kort",
      "Förifylld ansökan",
      "Gratis att använda",
    ],
    screenshot: `${SITE_URL}/og-image.png`,
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}

export function HowToSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Hur du får ersättning med Movingo-kort vid tågförsening",
    description:
      "Steg-för-steg guide för Movingo-pendlare att kräva ersättning vid förseningar på Mälartåg.",
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Registrera ditt Movingo-kort",
        text: "Lägg in kortnummer och vilka sträckor du pendlar. Tar tio sekunder.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Vi hittar förseningar",
        text: "Varje dag kollar vi Mälartågs data mot dina resor. Du behöver inte göra något.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Kräv ersättning direkt",
        text: "Vi fyller i ansökan med ditt kortnummer. Du trycker skicka. Klart.",
      },
    ],
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}
