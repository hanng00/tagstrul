import type { LegalPageConfig } from "@/components/LegalPage"

export const cookiesConfig: LegalPageConfig = {
  title: "Cookiepolicy",
  description:
    "Information om hur Tågstrul använder cookies och liknande tekniker för att förbättra din upplevelse.",
  canonical: "/cookies",
  sections: [
    {
      title: "Vad är cookies?",
      content: [
        {
          type: "paragraph",
          text: "Cookies är små textfiler som lagras på din enhet när du besöker en webbplats. De används för att webbplatsen ska fungera korrekt, komma ihåg dina inställningar och förstå hur tjänsten används.",
        },
      ],
    },
    {
      title: "Vilka cookies använder vi?",
      content: [
        {
          type: "card",
          title: "Nödvändiga cookies",
          description:
            "Dessa cookies krävs för att tjänsten ska fungera. De hanterar inloggning, säkerhet och grundläggande funktioner. Utan dessa kan du inte använda Tågstrul.",
          details: [
            { label: "Exempel", value: "Autentisering, sessionshantering" },
            { label: "Lagringstid", value: "Session eller upp till 30 dagar" },
          ],
        },
        {
          type: "card",
          title: "Funktionella cookies",
          description:
            "Dessa cookies kommer ihåg dina val och inställningar för att ge dig en bättre upplevelse, t.ex. språkval och visningspreferenser.",
          details: [
            { label: "Exempel", value: "Tema (ljust/mörkt läge), cookie-samtycke" },
            { label: "Lagringstid", value: "Upp till 1 år" },
          ],
        },
        {
          type: "card",
          title: "Analyscookies",
          description:
            "Vi använder PostHog för att förstå hur tjänsten används och förbättra den. Dessa cookies samlar in anonymiserad information om sidvisningar och användningsmönster.",
          details: [
            { label: "Leverantör", value: "PostHog (EU-hosting)" },
            { label: "Lagringstid", value: "Upp till 1 år" },
          ],
        },
      ],
    },
    {
      title: "Lokal lagring (localStorage)",
      content: [
        {
          type: "paragraph",
          text: "Utöver cookies använder vi webbläsarens lokala lagring för att spara vissa uppgifter på din enhet:",
        },
        {
          type: "list",
          items: [
            "Inloggningsstatus och autentiseringstoken",
            "Dina preferenser och inställningar",
            "Cachad data för snabbare laddning",
          ],
        },
      ],
    },
    {
      title: "Hantera cookies",
      content: [
        {
          type: "paragraph",
          text: "Du kan hantera cookies genom att:",
        },
        {
          type: "list",
          items: [
            {
              bold: "Webbläsarinställningar",
              text: "De flesta webbläsare låter dig blockera eller radera cookies. Observera att detta kan påverka tjänstens funktion.",
            },
            {
              bold: "Cookie-banner",
              text: "När du besöker oss första gången kan du välja vilka icke-nödvändiga cookies du accepterar.",
            },
          ],
        },
        {
          type: "paragraph",
          text: "Läs mer om hur du hanterar cookies i din webbläsare:",
        },
        {
          type: "list",
          items: [
            '<a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-2">Google Chrome</a>',
            '<a href="https://support.mozilla.org/sv/kb/aktivera-och-inaktivera-kakor" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-2">Mozilla Firefox</a>',
            '<a href="https://support.apple.com/sv-se/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-2">Safari</a>',
          ],
        },
      ],
    },
    {
      title: "Kontakt",
      content: [
        {
          type: "paragraph",
          text: 'Har du frågor om vår användning av cookies? Kontakta oss via <a href="/om" class="text-foreground underline underline-offset-2">feedbackformuläret</a>.',
        },
      ],
    },
  ],
}
