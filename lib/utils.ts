export const fieldColors: { [key: string]: string } = {
  "免疫学関連": "#DDA0DD",
  "造血器腫瘍学・造血幹細胞・造血発生関連": "#FF9999",
  "ウイルス学関連": "#99CCFF",
  "細菌学(含真菌学)・寄生虫学関連": "#99FF99",
  "血栓止血学・血管生物学関連": "#FFCC99",
  "その他": "#CCCCCC",
};

import Papa from "papaparse";

export interface Researcher {
  id: string;
  name: string;
  affiliation: string;
  program: string;
  theme: string;
  field: string;
  keywords: string;
  keytechnology: string;
  events: string;
  connections?: Connection[];
}

export interface Connection {
  id: string;
  score: number;
}

export interface FilterState {
  search: string;
  fields: string[];
  fieldMode: "AND" | "OR";
  keywords: string[];
  keywordMode: "AND" | "OR";
  keytechnologies: string[];
  keytechnologyMode: "AND" | "OR";
  programs: string[];
  programMode: "AND" | "OR";
  selectedEvent: string;
}

export function splitByDelimiters(str: string): string[] {
  if (!str) return [];
  const cleaned = str.replace(/^["']|["']$/g, "").trim();
  return cleaned
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function extractAllEvents(researchers: Researcher[]): string[] {
  const eventSet = new Set<string>();
  researchers.forEach((r) => {
    if (r.events) {
      r.events.split("|").forEach((e) => {
        const trimmed = e.trim();
        if (trimmed) eventSet.add(trimmed);
      });
    }
  });
  return Array.from(eventSet).sort();
}

export async function loadResearchers(): Promise<Researcher[]> {
  const response = await fetch("/data/researchers.csv");
  const csvText = await response.text();

  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const researchers = results.data as Researcher[];
        const withConnections = calculateConnections(researchers);
        resolve(withConnections);
      },
    });
  });
}

function calculateConnections(researchers: Researcher[]): Researcher[] {
  return researchers.map((researcher) => {
    const connections: Connection[] = [];

    researchers.forEach((other) => {
      if (other.id === researcher.id) return;

      let score = 0;

      const researcherFields = splitByDelimiters(researcher.field);
      const otherFields = splitByDelimiters(other.field);
      researcherFields.forEach((field) => {
        if (otherFields.includes(field)) score += 3;
      });

      const researcherKeywords = splitByDelimiters(researcher.keywords);
      const otherKeywords = splitByDelimiters(other.keywords);
      researcherKeywords.forEach((keyword) => {
        if (otherKeywords.includes(keyword)) score += 2;
      });

      const researcherTech = splitByDelimiters(researcher.keytechnology);
      const otherTech = splitByDelimiters(other.keytechnology);
      researcherTech.forEach((tech) => {
        if (otherTech.includes(tech)) score += 2;
      });

      if (score > 0) {
        connections.push({ id: other.id, score });
      }
    });

    return { ...researcher, connections };
  });
}

export function filterResearchers(
  researchers: Researcher[],
  filters: FilterState
): Researcher[] {
  return researchers.filter((researcher) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        researcher.name?.toLowerCase().includes(searchLower) ||
        researcher.theme?.toLowerCase().includes(searchLower) ||
        researcher.affiliation?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.selectedEvent) {
      const researcherEvents = researcher.events
        ? researcher.events.split("|").map((e) => e.trim())
        : [];
      if (!researcherEvents.includes(filters.selectedEvent)) return false;
    }

    if (filters.fields.length > 0) {
      const researcherFields = splitByDelimiters(researcher.field);
      if (filters.fieldMode === "AND") {
        if (!filters.fields.every((f) => researcherFields.includes(f)))
          return false;
      } else {
        if (!filters.fields.some((f) => researcherFields.includes(f)))
          return false;
      }
    }

    if (filters.keywords.length > 0) {
      const researcherKeywords = splitByDelimiters(researcher.keywords);
      if (filters.keywordMode === "AND") {
        if (!filters.keywords.every((k) => researcherKeywords.includes(k)))
          return false;
      } else {
        if (!filters.keywords.some((k) => researcherKeywords.includes(k)))
          return false;
      }
    }

    if (filters.keytechnologies.length > 0) {
      const researcherTech = splitByDelimiters(researcher.keytechnology);
      if (filters.keytechnologyMode === "AND") {
        if (!filters.keytechnologies.every((t) => researcherTech.includes(t)))
          return false;
      } else {
        if (!filters.keytechnologies.some((t) => researcherTech.includes(t)))
          return false;
      }
    }

    if (filters.programs.length > 0) {
      const researcherPrograms = splitByDelimiters(researcher.program);
      if (filters.programMode === "AND") {
        if (!filters.programs.every((p) => researcherPrograms.includes(p)))
          return false;
      } else {
        if (!filters.programs.some((p) => researcherPrograms.includes(p)))
          return false;
      }
    }

    return true;
  });
}

export function getUniqueValues(
  researchers: Researcher[],
  field: keyof Researcher
): string[] {
  const values = new Set<string>();
  researchers.forEach((researcher) => {
    if (typeof researcher[field] === "string") {
      if (
        ["keywords", "keytechnology", "field", "program", "theme"].includes(
          field
        )
      ) {
        const items = splitByDelimiters(researcher[field] as string);
        items.forEach((item) => {
          if (item) values.add(item.trim());
        });
      } else {
        if (researcher[field]) values.add((researcher[field] as string).trim());
      }
    }
  });
  return Array.from(values).sort();
}
export const loadResearchersData = loadResearchers;