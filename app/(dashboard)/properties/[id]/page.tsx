import { db } from "@/lib/db";
import { properties, projections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PropertyDetail from "./property-detail";

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, params.id));

  if (!property) notFound();

  const userId = (session.user as any).id as string;
  const isOwner = property.ownerId === userId;

  const projectionsList = await db
    .select()
    .from(projections)
    .where(eq(projections.propertyId, params.id));

  return (
    <PropertyDetail
      property={property}
      projections={projectionsList}
      isOwner={isOwner}
    />
  );
}
