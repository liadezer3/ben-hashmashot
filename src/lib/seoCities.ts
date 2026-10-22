// City pages for SEO: /shabbat-times/:citySlug
export interface SeoCity {
  slug: string;
  /** key understood by getCityCoords / getShabbatZmanim */
  key: string;
  he: string;
}

export const SEO_CITIES: SeoCity[] = [
  { slug: "jerusalem", key: "jerusalem", he: "ירושלים" },
  { slug: "tel-aviv", key: "tel aviv", he: "תל אביב" },
  { slug: "haifa", key: "haifa", he: "חיפה" },
  { slug: "beer-sheva", key: "beersheba", he: "באר שבע" },
  { slug: "maale-adumim", key: "maale adumim", he: "מעלה אדומים" },
  { slug: "ashdod", key: "ashdod", he: "אשדוד" },
  { slug: "netanya", key: "netanya", he: "נתניה" },
  { slug: "rishon-lezion", key: "rishon lezion", he: "ראשון לציון" },
  { slug: "petah-tikva", key: "petah tikva", he: "פתח תקווה" },
];

export const findSeoCity = (slug?: string) => SEO_CITIES.find((c) => c.slug === slug);
