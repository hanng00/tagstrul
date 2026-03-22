function stationToSlug(station: string): string {
  return station
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9-]/g, "")
}

export const popularRoutes = [
  { from: "Stockholm C", to: "Uppsala C" },
  { from: "Stockholm C", to: "Västerås C" },
  { from: "Stockholm C", to: "Eskilstuna C" },
  { from: "Stockholm C", to: "Örebro C" },
  { from: "Stockholm C", to: "Sala" },
  { from: "Uppsala C", to: "Arlanda C" },
  { from: "Uppsala C", to: "Knivsta" },
  { from: "Uppsala C", to: "Märsta" },
  { from: "Västerås C", to: "Eskilstuna C" },
  { from: "Västerås C", to: "Köping" },
  { from: "Örebro C", to: "Hallsberg" },
  { from: "Eskilstuna C", to: "Strängnäs" },
  { from: "Stockholm C", to: "Bålsta" },
  { from: "Stockholm C", to: "Enköping" },
  { from: "Uppsala C", to: "Storvreta" },
  { from: "Uppsala C", to: "Tierp" },
]

export const popularRouteSlugs = popularRoutes.map(
  (r) => `${stationToSlug(r.from)}-till-${stationToSlug(r.to)}`
)

export { stationToSlug }
