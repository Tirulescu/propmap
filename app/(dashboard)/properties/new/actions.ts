"use server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProperty(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  const userId = (session.user as any).id as string;

  const type = formData.get("type") as string;
  const name = formData.get("name") as string;
  if (!name || !type) throw new Error("Nombre y tipo son obligatorios");

  const id = nanoid(12);
  await db.insert(properties).values({
    id,
    ownerId: userId,
    type: type as any,
    name,
    address: (formData.get("address") as string) || null,
    locationLat: formData.get("locationLat") ? parseFloat(formData.get("locationLat") as string) : null,
    locationLng: formData.get("locationLng") ? parseFloat(formData.get("locationLng") as string) : null,
    catastroRef: (formData.get("catastroRef") as string) || null,
    catastroUrl: (formData.get("catastroUrl") as string) || null,
    plantedDate: formData.get("plantedDate") ? new Date(formData.get("plantedDate") as string) : null,
    species: (formData.get("species") as string) || null,
    lastHarvestDate: formData.get("lastHarvestDate") ? new Date(formData.get("lastHarvestDate") as string) : null,
    lastHarvestProfit: formData.get("lastHarvestProfit") ? String(formData.get("lastHarvestProfit")) : null,
    rentalPrice: formData.get("rentalPrice") ? String(formData.get("rentalPrice")) : null,
    tenantName: (formData.get("tenantName") as string) || null,
    tenantEmail: (formData.get("tenantEmail") as string) || null,
    tenantPhone: (formData.get("tenantPhone") as string) || null,
    leaseStart: formData.get("leaseStart") ? new Date(formData.get("leaseStart") as string) : null,
    leaseEnd: formData.get("leaseEnd") ? new Date(formData.get("leaseEnd") as string) : null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/properties");
  redirect("/properties");
}
