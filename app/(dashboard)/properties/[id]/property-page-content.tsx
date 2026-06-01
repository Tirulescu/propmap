import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/insforge-server";
import { loadPropertyBundle } from "@/lib/property-access";
import PropertyDetail from "./property-detail";

export default async function PropertyPageContent({ id }: { id: string }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const bundle = await loadPropertyBundle(
    id,
    ctx.user.id,
    ctx.user.email,
    {},
    ctx.client.database
  );
  if (!bundle) notFound();

  const { property, projections, history, access } = bundle;

  return (
    <PropertyDetail
      property={property}
      projections={projections}
      history={history}
      accessRole={access.role}
    />
  );
}
