import type { PropertyType } from "@/lib/db/types";

type FilterableProperty = {
  type: PropertyType;
  name: string;
  address?: string | null;
  catastro_ref?: string | null;
  notes?: string | null;
};

export function filterPropertiesByQueryAndTypes<T extends FilterableProperty>(
  list: T[],
  query: string,
  selectedTypes: PropertyType[]
): T[] {
  const q = query.trim().toLowerCase();
  return list.filter((p) => {
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(p.type);
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.catastro_ref && p.catastro_ref.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q));
    return matchesType && matchesQuery;
  });
}
