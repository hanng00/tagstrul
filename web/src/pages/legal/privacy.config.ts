import type { LegalPageConfig } from "@/components/LegalPage"

export const privacyConfig: LegalPageConfig = {
  title: "Integritetspolicy",
  description:
    "Läs om hur Tågstrul hanterar dina personuppgifter enligt GDPR. Vi värnar om din integritet och samlar endast in data som krävs för tjänsten.",
  canonical: "/integritet",
  sections: [
    {
      title: "1. Vem är ansvarig för dina uppgifter?",
      content: [
        {
          type: "paragraph",
          text: 'Tågstrul ("vi", "oss", "vår") är personuppgiftsansvarig för behandlingen av dina personuppgifter. Du kan kontakta oss via <a href="/om" class="text-foreground underline underline-offset-2">feedbackformuläret</a>.',
        },
      ],
    },
    {
      title: "2. Vilka uppgifter samlar vi in?",
      content: [
        {
          type: "paragraph",
          text: "Vi samlar in följande kategorier av personuppgifter:",
        },
        {
          type: "list",
          items: [
            { bold: "Kontaktuppgifter", text: "Förnamn, efternamn, e-postadress och telefonnummer" },
            { bold: "Identifikation", text: "Personnummer (krävs av SJ för ersättningsansökningar)" },
            { bold: "Betalningsuppgifter", text: "Swish-nummer för utbetalning av ersättning" },
            { bold: "Reseuppgifter", text: "Dina bevakade sträckor, avgångstider och information om förseningar" },
            { bold: "Movingo-kort", text: "Kortnummer, korttyp, pris, köpdatum och utgångsdatum" },
            { bold: "Teknisk data", text: "IP-adress, webbläsartyp, enhetsinformation och användningsmönster" },
          ],
        },
      ],
    },
    {
      title: "3. Varför behandlar vi dina uppgifter?",
      content: [
        {
          type: "paragraph",
          text: "Vi behandlar dina personuppgifter för att:",
        },
        {
          type: "list",
          items: [
            { bold: "Tillhandahålla tjänsten", text: "Bevaka dina resor, identifiera förseningar och skicka ersättningsansökningar till SJ å dina vägnar" },
            { bold: "Kommunicera med dig", text: "Skicka notiser om förseningar och uppdateringar om dina ärenden" },
            { bold: "Förbättra tjänsten", text: "Analysera användningsmönster för att utveckla och förbättra appen" },
            { bold: "Uppfylla rättsliga krav", text: "Hantera eventuella tvister och uppfylla bokföringskrav" },
          ],
        },
      ],
    },
    {
      title: "4. Rättslig grund för behandlingen",
      content: [
        {
          type: "paragraph",
          text: "Vi behandlar dina uppgifter baserat på:",
        },
        {
          type: "list",
          items: [
            { bold: "Avtal", text: "Behandlingen är nödvändig för att fullgöra vårt avtal med dig (tillhandahålla tjänsten)" },
            { bold: "Samtycke", text: "För marknadsföring och icke-nödvändiga cookies" },
            { bold: "Berättigat intresse", text: "För att förbättra och säkra tjänsten" },
          ],
        },
      ],
    },
    {
      title: "5. Vilka delar vi uppgifter med?",
      content: [
        {
          type: "paragraph",
          text: "Vi delar dina uppgifter med:",
        },
        {
          type: "list",
          items: [
            { bold: "SJ AB", text: "När du skickar en ersättningsansökan överförs dina uppgifter till SJ för handläggning" },
            { bold: "PostHog", text: "För produktanalys (EU-baserad hosting, anonymiserad data)" },
            { bold: "AWS", text: "Vår infrastrukturleverantör (data lagras inom EU)" },
          ],
        },
        {
          type: "paragraph",
          text: "Vi säljer aldrig dina personuppgifter till tredje part.",
        },
      ],
    },
    {
      title: "6. Hur länge sparar vi dina uppgifter?",
      content: [
        {
          type: "paragraph",
          text: "Vi sparar dina uppgifter så länge du har ett aktivt konto hos oss. När du raderar ditt konto tar vi bort dina personuppgifter inom 30 dagar, förutom uppgifter vi är skyldiga att spara enligt lag (t.ex. bokföringsunderlag i 7 år).",
        },
      ],
    },
    {
      title: "7. Dina rättigheter",
      content: [
        {
          type: "paragraph",
          text: "Enligt GDPR har du rätt att:",
        },
        {
          type: "list",
          items: [
            { bold: "Få tillgång", text: "Begära en kopia av dina personuppgifter" },
            { bold: "Rätta", text: "Korrigera felaktiga uppgifter" },
            { bold: "Radera", text: 'Begära att vi raderar dina uppgifter ("rätten att bli glömd")' },
            { bold: "Begränsa", text: "Begränsa behandlingen av dina uppgifter" },
            { bold: "Flytta", text: "Få ut dina uppgifter i ett maskinläsbart format (dataportabilitet)" },
            { bold: "Invända", text: "Invända mot behandling baserad på berättigat intresse" },
          ],
        },
        {
          type: "paragraph",
          text: 'Du kan utöva dessa rättigheter genom att kontakta oss via <a href="/om" class="text-foreground underline underline-offset-2">feedbackformuläret</a>. För att radera ditt konto, skicka en begäran så hanterar vi den inom 30 dagar.',
        },
      ],
    },
    {
      title: "8. Cookies och spårning",
      content: [
        {
          type: "paragraph",
          text: 'Vi använder cookies och liknande tekniker för att förbättra din upplevelse. Läs mer i vår <a href="/cookies" class="text-foreground underline underline-offset-2">cookiepolicy</a>.',
        },
      ],
    },
    {
      title: "9. Säkerhet",
      content: [
        {
          type: "paragraph",
          text: "Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att skydda dina personuppgifter mot obehörig åtkomst, förlust eller förstörelse. Detta inkluderar kryptering av data i transit och i vila, samt begränsad åtkomst till personuppgifter.",
        },
      ],
    },
    {
      title: "10. Ändringar i policyn",
      content: [
        {
          type: "paragraph",
          text: "Vi kan uppdatera denna policy vid behov. Vid väsentliga ändringar meddelar vi dig via e-post eller i appen. Den senaste versionen finns alltid tillgänglig på denna sida.",
        },
      ],
    },
    {
      title: "11. Klagomål",
      content: [
        {
          type: "paragraph",
          text: "Om du är missnöjd med hur vi hanterar dina personuppgifter har du rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY):",
        },
        {
          type: "paragraph",
          text: '<a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" class="text-foreground underline underline-offset-2">www.imy.se</a>',
        },
      ],
    },
  ],
}
