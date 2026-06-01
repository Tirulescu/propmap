import { loadAccessibleProperties } from "@/lib/dashboard-auth";
import PropertyList from "./property-list";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const list = await loadAccessibleProperties();
  return <PropertyList properties={list} />;
}
