import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/insforge-server";
import {
  getAllAccessibleProperties,
  type PropertyListItem,
} from "@/lib/property-access";

export async function loadAccessibleProperties(options?: {
  forMap?: boolean;
}): Promise<PropertyListItem[]> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  try {
    return await getAllAccessibleProperties(
      ctx.user.id,
      ctx.user.email,
      options,
      ctx.client.database
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    console.error("Error fetching properties:", message);
    return [];
  }
}
