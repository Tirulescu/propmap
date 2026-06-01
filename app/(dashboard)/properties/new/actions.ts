"use server";
import { requireAuthContext } from "@/lib/insforge-server";
import { parsePropertyFormData } from "@/lib/property-form";
import { syncRentalProjections } from "@/lib/rental-projections";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function createProperty(formData: FormData) {
  const { user, client } = await requireAuthContext();
  const db = client.database;

  const payload = parsePropertyFormData(formData);
  if (!payload.name || !payload.type) throw new Error("Nombre y tipo son obligatorios");

  const id = nanoid(12);
  const { error } = await db.from("properties").insert({
    id,
    owner_id: user.id,
    ...payload,
  });
  if (error) throw new Error(error.message);

  await syncRentalProjections(db, id, {
    type: payload.type as string,
    rental_price: (payload.rental_price as string | null) ?? null,
    lease_start: (payload.lease_start as string | null) ?? null,
    lease_end: (payload.lease_end as string | null) ?? null,
  });

  revalidatePath("/properties");
  return { id };
}
