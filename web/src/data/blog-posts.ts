export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: "movingo-ersattning-guide",
    title: "Movingo-ersättning: Komplett guide för pendlare",
    description:
      "Allt du behöver veta om ersättning vid förseningar med Movingo-kort. Regler, belopp och hur du kräver tillbaka pengar.",
    date: "2026-03-20",
    readTime: "5 min",
  },
  {
    slug: "hur-mycket-ersattning-forsening",
    title: "Hur mycket ersättning får jag vid tågförsening?",
    description:
      "Ersättningsnivåer för Movingo-kort: 50 kr vid 20 min, 75 kr vid 40 min, 100% vid 60+ min. Se exakt vad du har rätt till.",
    date: "2026-03-18",
    readTime: "4 min",
  },
  {
    slug: "vanligaste-forseningarna-malardalen",
    title: "Vanligaste förseningarna i Mälardalen 2026",
    description:
      "Statistik över vilka sträckor som drabbas mest av förseningar. Stockholm-Uppsala toppar listan.",
    date: "2026-03-15",
    readTime: "3 min",
  },
]
