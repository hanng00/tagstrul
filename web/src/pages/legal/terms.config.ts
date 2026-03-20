import type { LegalPageConfig } from "@/components/LegalPage"

export const termsConfig: LegalPageConfig = {
  title: "Användarvillkor",
  description:
    "Läs användarvillkoren för Tågstrul. Genom att använda tjänsten godkänner du dessa villkor.",
  canonical: "/villkor",
  sections: [
    {
      title: "1. Om tjänsten",
      content: [
        {
          type: "paragraph",
          text: "Tågstrul är en tjänst som hjälper dig att bevaka dina tågresor och ansöka om ersättning vid förseningar. Vi agerar som ditt ombud och skickar ersättningsansökningar till SJ å dina vägnar.",
        },
        {
          type: "paragraph",
          text: 'Genom att skapa ett konto och använda tjänsten godkänner du dessa villkor samt vår <a href="/integritet" class="text-foreground underline underline-offset-2">integritetspolicy</a>.',
        },
      ],
    },
    {
      title: "2. Ditt konto",
      content: [
        {
          type: "paragraph",
          text: "För att använda tjänsten behöver du skapa ett konto. Du ansvarar för att:",
        },
        {
          type: "list",
          items: [
            "Uppgifterna du anger är korrekta och aktuella",
            "Hålla dina inloggningsuppgifter säkra",
            "Meddela oss omedelbart om du misstänker obehörig användning av ditt konto",
          ],
        },
        {
          type: "paragraph",
          text: "Du måste vara minst 18 år för att använda tjänsten, eller ha vårdnadshavares samtycke.",
        },
      ],
    },
    {
      title: "3. Ditt ansvar vid ersättningsansökningar",
      content: [
        {
          type: "paragraph",
          text: "<strong class=\"text-foreground\">Tågstrul är ett hjälpverktyg som förenklar processen att ansöka om ersättning — men du som användare bär det fulla ansvaret för varje ansökan som skickas.</strong>",
        },
        {
          type: "paragraph",
          text: "När du skickar en ersättningsansökan via Tågstrul intygar och ansvarar du för att:",
        },
        {
          type: "list",
          items: [
            "Du faktiskt reste med det aktuella tåget på det angivna datumet",
            "Alla uppgifter du anger (namn, personnummer, kontaktuppgifter etc.) är korrekta",
            "Du har rätt att ansöka om ersättning enligt SJ:s gällande villkor och regler",
            "Du inte redan har ansökt om eller fått ersättning för samma resa",
            "Ansökan uppfyller alla krav som SJ ställer för förseningsersättning",
          ],
        },
        {
          type: "paragraph",
          text: "Tågstrul kontrollerar inte och kan inte verifiera att du uppfyller SJ:s villkor för ersättning. Vi vidarebefordrar endast den information du anger till SJ.",
        },
      ],
    },
    {
      title: "4. Fullmakt och ombud",
      content: [
        {
          type: "paragraph",
          text: "När du skickar en ersättningsansökan via Tågstrul ger du oss fullmakt att agera som ditt ombud gentemot SJ. Detta innebär att:",
        },
        {
          type: "list",
          items: [
            "Vi skickar ansökan i ditt namn med de uppgifter du angett",
            "Ersättningen betalas ut direkt till dig av SJ, inte via oss",
            "Du ensam ansvarar för att ansökan är korrekt och berättigad",
          ],
        },
      ],
    },
    {
      title: "5. Tjänstens omfattning",
      content: [
        {
          type: "paragraph",
          text: "Tågstrul tillhandahåller:",
        },
        {
          type: "list",
          items: [
            "Bevakning av dina angivna pendlingssträckor",
            "Identifiering av förseningar som kan ge rätt till ersättning",
            "Ett förenklat sätt att skicka ersättningsansökningar till SJ",
            "Notiser om förseningar (om aktiverat)",
          ],
        },
        {
          type: "paragraph",
          text: "<strong class=\"text-foreground\">Tågstrul garanterar inte och ansvarar inte för:</strong>",
        },
        {
          type: "list",
          items: [
            "Att ersättningsansökningar godkänns av SJ",
            "Att du uppfyller SJ:s villkor för ersättning",
            "Att förseningsinformation är korrekt, komplett eller uppdaterad",
            "Att beräknad ersättning motsvarar faktisk utbetalning",
            "Oavbruten tillgång till tjänsten",
          ],
        },
      ],
    },
    {
      title: "6. Avgifter",
      content: [
        {
          type: "paragraph",
          text: "Tjänsten är för närvarande gratis att använda. Vi tar ingen del av din ersättning. Om vi i framtiden inför avgifter kommer vi meddela dig i förväg och du kan då välja att avsluta ditt konto.",
        },
      ],
    },
    {
      title: "7. Dina skyldigheter",
      content: [
        {
          type: "paragraph",
          text: "Du förbinder dig att:",
        },
        {
          type: "list",
          items: [
            "Endast ansöka om ersättning för resor du faktiskt gjort och har rätt till ersättning för",
            "Ange korrekta och sanningsenliga uppgifter",
            "Själv kontrollera att du uppfyller SJ:s villkor innan du skickar en ansökan",
            "Inte missbruka tjänsten eller försöka kringgå dess begränsningar",
            "Inte använda tjänsten för olagliga ändamål",
          ],
        },
        {
          type: "paragraph",
          text: "<strong class=\"text-foreground\">Felaktiga eller obefogade ansökningar kan leda till att SJ avslår framtida ansökningar, kräver återbetalning, eller polisanmäler för bedrägeri. Tågstrul ansvarar inte för konsekvenser av felaktiga ansökningar.</strong>",
        },
      ],
    },
    {
      title: "8. Ansvarsbegränsning",
      content: [
        {
          type: "paragraph",
          text: 'Tågstrul tillhandahålls "i befintligt skick" som ett hjälpverktyg. <strong class="text-foreground">Vi friskriver oss från allt ansvar relaterat till dina ersättningsansökningar och deras utfall.</strong>',
        },
        {
          type: "paragraph",
          text: "Vi ansvarar inte för:",
        },
        {
          type: "list",
          items: [
            "Avslag på ersättningsansökningar från SJ",
            "Konsekvenser av felaktiga eller obefogade ansökningar",
            "Att du uppfyller eller inte uppfyller SJ:s villkor",
            "Felaktig, ofullständig eller inaktuell förseningsinformation",
            "Felaktiga beräkningar av ersättningsbelopp",
            "Tekniska fel eller avbrott i tjänsten",
            "Indirekta skador, utebliven ersättning eller annan ekonomisk förlust",
          ],
        },
        {
          type: "paragraph",
          text: "Vårt totala ansvar är under alla omständigheter begränsat till det belopp du eventuellt betalat för tjänsten under de senaste 12 månaderna (för närvarande 0 kr).",
        },
      ],
    },
    {
      title: "9. Immateriella rättigheter",
      content: [
        {
          type: "paragraph",
          text: "Alla rättigheter till tjänsten, inklusive varumärken, design och programkod, tillhör Tågstrul. Du får inte kopiera, modifiera eller distribuera någon del av tjänsten utan vårt skriftliga medgivande.",
        },
      ],
    },
    {
      title: "10. Uppsägning",
      content: [
        {
          type: "paragraph",
          text: 'Du kan när som helst avsluta ditt konto genom att kontakta oss via <a href="/om" class="text-foreground underline underline-offset-2">feedbackformuläret</a>. Vi kan stänga av eller avsluta ditt konto om du bryter mot dessa villkor.',
        },
        {
          type: "paragraph",
          text: "Vid uppsägning raderas dina personuppgifter enligt vår integritetspolicy.",
        },
      ],
    },
    {
      title: "11. Ändringar av villkoren",
      content: [
        {
          type: "paragraph",
          text: "Vi kan uppdatera dessa villkor vid behov. Vid väsentliga ändringar meddelar vi dig via e-post eller i appen minst 30 dagar i förväg. Fortsatt användning efter ändringarna träder i kraft innebär att du godkänner de nya villkoren.",
        },
      ],
    },
    {
      title: "12. Tillämplig lag och tvister",
      content: [
        {
          type: "paragraph",
          text: "Dessa villkor regleras av svensk lag. Tvister ska i första hand lösas genom förhandling. Om det inte lyckas kan tvisten prövas av Allmänna reklamationsnämnden (ARN) eller svensk domstol.",
        },
      ],
    },
    {
      title: "13. Kontakt",
      content: [
        {
          type: "paragraph",
          text: 'Har du frågor om dessa villkor? Kontakta oss via <a href="/om" class="text-foreground underline underline-offset-2">feedbackformuläret</a>.',
        },
      ],
    },
  ],
}
