"use server";
import { requireAuthContext } from "@/lib/insforge-server";
import { getPropertyAccess } from "@/lib/property-access";
import { parsePropertyFormData } from "@/lib/property-form";
import { syncRentalProjections } from "@/lib/rental-projections";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProperty(propertyId: string, formData: FormData) {
  const { user, client } = await requireAuthContext();
  const db = client.database;

  const access = await getPropertyAccess(propertyId, user.id, user.email, db);
  if (!access?.canEdit) throw new Error("No autorizado");

  const payload = parsePropertyFormData(formData);
  if (!payload.name || !payload.type) throw new Error("Nombre y tipo son obligatorios");

  const { error } = await db.from("properties").update(payload).eq("id", propertyId);

  if (error) throw new Error(error.message);

  await syncRentalProjections(db, propertyId, {
    type: payload.type as string,
    rental_price: (payload.rental_price as string | null) ?? null,
    lease_start: (payload.lease_start as string | null) ?? null,
    lease_end: (payload.lease_end as string | null) ?? null,
  });

  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  redirect("/properties");
}

export async function deleteProperty(propertyId: string) {
  const { user, client } = await requireAuthContext();
  const db = client.database;

  const access = await getPropertyAccess(propertyId, user.id, user.email, db);
  if (!access?.isOwner) throw new Error("No autorizado");

  const { error } = await db.from("properties").delete().eq("id", propertyId);
  if (error) throw new Error(error.message);

  revalidatePath("/properties");
  redirect("/properties");
}
