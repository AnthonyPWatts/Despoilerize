// Published names only: no roles, departures or results are encoded here.
// Sources and refresh instructions: docs/big-brother-pack.md (27 September 2026).
export const bigBrotherUk2026Cast = [
  { name: "Yasmin", aliases: [] },
  { name: "Harry", aliases: ["Harry Symonds"] },
  { name: "Chelsey", aliases: ["Chelsey Ammari"] },
  { name: "Philip", aliases: ["Philip Regan", "Queen of Scotty Road"] },
  { name: "Lynx", aliases: ["Lynx Noumey"] },
  { name: "Charlotte", aliases: ["Charlotte Nott"] },
  { name: "Pauline", aliases: ["Pauline Adeyemo"] },
  { name: "Tays", aliases: [] },
  { name: "Rochelle", aliases: ["Rochelle Rackham"] },
  { name: "Millie", aliases: ["Millie Jarrett"] },
  { name: "Frankie", aliases: ["Frankie Taber"] },
  { name: "Samuel", aliases: ["Samuel Keen"] },
  { name: "Rob", aliases: ["Rob Stirzaker"] },
  { name: "Rhianna", aliases: ["Rhianna Collins"] },
  { name: "Omar", aliases: ["Omar El Mayer"] },
  { name: "Johanne", aliases: ["Johanne Cade"] }
];

// Published variants and programme presenters/guests also need show context.
export const bigBrotherContextNames = [
  ...bigBrotherUk2026Cast.map(person => person.name),
  "Sam", "Phillip", "AJ Odudu", "Will Best", "Kate Lawler", "GK Barry",
  "Jedward", "Michael Taylor"
];
