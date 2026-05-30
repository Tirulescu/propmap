import { insforge } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/insforge-server";
import { redirect } from "next/navigation";
import PropertyDetail from "./property-detail";

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const { data: property, error: propErr } = await insforge.database
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (propErr || !property) notFound();

  const userId = session.user.id;
  const isOwner = property.owner_id === userId;

  const { data: projectionsList, error: projErr } = await insforge.database
    .from('projections')
    .select('*')
    .eq('property_id', params.id);

  if (projErr) {
    console.error("Error fetching projections:", projErr);
  }

  return (
    <PropertyDetail
      property={property}
      projections={projectionsList || []}
      isOwner={isOwner}
    />
  );
}
