import { loadAccessibleProperties } from "@/lib/dashboard-auth";
import PropertiesMap from "./properties-map";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const list = await loadAccessibleProperties({ forMap: true });
  return <PropertiesMap properties={list} />;
}
