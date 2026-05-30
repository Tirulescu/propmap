"use server";
import { insforge } from "@/lib/db";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/insforge-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProperty(formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error("No autenticado");
  const userId = session.user.id;

  const type = formData.get("type") as string;
  const name = formData.get("name") as string;
  if (!name || !type) throw new Error("Nombre y tipo son obligatorios");

  const id = nanoid(12);
  const { error } = await insforge.database.from('properties').insert({
    id,
    owner_id: userId,
    type,
    name,
    address: (formData.get("address") as string) || null,
    location_lat: formData.get("locationLat") ? parseFloat(formData.get("locationLat") as string) : null,
    location_lng: formData.get("locationLng") ? parseFloat(formData.get("locationLng") as string) : null,
    catastro_ref: (formData.get("catastroRef") as string) || null,
    catastro_url: (formData.get("catastroUrl") as string) || null,
    planted_date: formData.get("plantedDate") ? new Date(formData.get("plantedDate") as string).toISOString() : null,
    species: (formData.get("species") as string) || null,
    last_harvest_date: formData.get("lastHarvestDate") ? new Date(formData.get("lastHarvestDate") as string).toISOString() : null,
    last_harvest_profit: formData.get("lastHarvestProfit") ? String(formData.get("lastHarvestProfit")) : null,
    rental_price: formData.get("rentalPrice") ? String(formData.get("rentalPrice")) : null,
    tenant_name: (formData.get("tenantName") as string) || null,
    tenant_email: (formData.get("tenantEmail") as string) || null,
    tenant_phone: (formData.get("tenantPhone") as string) || null,
    lease_start: formData.get("leaseStart") ? new Date(formData.get("leaseStart") as string).toISOString() : null,
    lease_end: formData.get("leaseEnd") ? new Date(formData.get("leaseEnd") as string).toISOString() : null,
    notes: (formData.get("notes") as string) || null,
  }).select();

  if (error) throw new Error(error.message);

  revalidatePath("/properties");
  redirect("/properties");
}
