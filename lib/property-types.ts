import type { PropertyType } from "@/lib/db/types";

export const PROPERTY_TYPE_EMOJI: Record<PropertyType, string> = {
  MONTE: "🌲",
  PRADO: "🌾",
  CASA: "🏡",
  PISO: "🏢",
  TERRENO: "📐",
  FINCA: "🚜",
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  MONTE: "Monte",
  PRADO: "Prado",
  CASA: "Casa",
  PISO: "Piso",
  TERRENO: "Terreno",
  FINCA: "Finca",
};

export const PROPERTY_TYPE_OPTIONS = (
  Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[]
).map((value) => ({
  value,
  emoji: PROPERTY_TYPE_EMOJI[value],
  label: PROPERTY_TYPE_LABEL[value],
}));
