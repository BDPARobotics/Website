// Static list of BDPA chapters, grouped by region, for the signup chapter
// picker. `id` doubles as the Firestore chapters/{id} document id if/when
// chapter documents (mentors, roster, etc.) get created later.

export interface ChapterOption {
  id: string;
  name: string;
}

export interface ChapterRegion {
  region: string;
  chapters: ChapterOption[];
}

export const CHAPTER_REGIONS: ChapterRegion[] = [
  {
    region: "Northeast Region",
    chapters: [
      { id: "baltimore", name: "Baltimore" },
      { id: "boston-metrowest", name: "Boston Metrowest" },
      {
        id: "district-of-columbia-washington-dc",
        name: "District of Columbia (Washington, D.C.)",
      },
      { id: "hartford", name: "Hartford" },
      { id: "new-jersey", name: "New Jersey" },
      { id: "new-york", name: "New York" },
      { id: "northern-delaware", name: "Northern Delaware" },
      { id: "northern-virginia", name: "Northern Virginia" },
      { id: "rhode-island", name: "Rhode Island" },
    ],
  },
  {
    region: "Midwest Region",
    chapters: [
      { id: "central-illinois", name: "Central Illinois" },
      { id: "chicago", name: "Chicago" },
      { id: "cincinnati", name: "Cincinnati" },
      { id: "cleveland", name: "Cleveland" },
      { id: "columbus-oh", name: "Columbus, OH" },
      { id: "detroit", name: "Detroit" },
      { id: "indianapolis", name: "Indianapolis" },
      { id: "kansas-city", name: "Kansas City" },
      { id: "milwaukee", name: "Milwaukee" },
      { id: "southern-minnesota", name: "Southern Minnesota" },
      { id: "st-louis", name: "St. Louis" },
      { id: "twin-cities", name: "Twin Cities" },
    ],
  },
  {
    region: "South Region",
    chapters: [
      { id: "atlanta", name: "Atlanta" },
      { id: "baton-rouge", name: "Baton Rouge" },
      { id: "charlotte", name: "Charlotte" },
      { id: "greater-birmingham", name: "Greater Birmingham" },
      { id: "huntsville", name: "Huntsville" },
      { id: "memphis", name: "Memphis" },
      { id: "middle-tennessee", name: "Middle Tennessee" },
      { id: "monroe", name: "Monroe" },
      { id: "richmond", name: "Richmond" },
      { id: "south-florida", name: "South Florida" },
      { id: "triangle", name: "Triangle" },
    ],
  },
  {
    region: "West Region",
    chapters: [
      { id: "austin", name: "Austin" },
      { id: "bay-area-san-francisco", name: "Bay Area (San Francisco)" },
      { id: "dallas", name: "Dallas" },
      { id: "houston", name: "Houston" },
      { id: "los-angeles", name: "Los Angeles" },
      { id: "nevada", name: "Nevada" },
      { id: "oklahoma-city", name: "Oklahoma City" },
      { id: "portland", name: "Portland" },
      { id: "seattle", name: "Seattle" },
    ],
  },
];

const CHAPTERS_BY_ID = new Map(
  CHAPTER_REGIONS.flatMap((r) => r.chapters).map((c) => [c.id, c] as const),
);

export function getChapterById(id: string | null | undefined): ChapterOption | null {
  if (!id) return null;
  return CHAPTERS_BY_ID.get(id) ?? null;
}
