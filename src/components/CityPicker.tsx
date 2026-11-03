import { SEO_CITIES } from "@/lib/seoCities";

export function CityPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  return (
    <select
      aria-label="בחירת עיר"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-input bg-background px-3 py-2 text-sm print:hidden"
    >
      {SEO_CITIES.map((c) => (
        <option key={c.slug} value={c.key}>{c.he}</option>
      ))}
    </select>
  );
}

export const cityHe = (key: string) => SEO_CITIES.find((c) => c.key === key)?.he ?? key;
