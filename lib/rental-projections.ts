import { nanoid } from "nanoid";
import type { getDatabase } from "@/lib/insforge-server";
import type { PropertyType } from "@/lib/db/types";

export const RENTAL_AUTO_DESCRIPTION = "rental:auto";
export const RENTAL_PROJECTION_CATEGORY = "Alquiler";

type DatabaseClient = Awaited<ReturnType<typeof getDatabase>>;

interface RentalProjectionRow {
  id: string;
  year: number;
  month: number | null;
  amount: string;
}

export interface RentalProjectionInput {
  type: PropertyType | string;
  rental_price: string | null;
  lease_start: string | null;
  lease_end: string | null;
}

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

/** Meses inclusivos del contrato (UTC, coherente con formatDate). */
export function getLeaseMonths(
  leaseStart: string | null,
  leaseEnd: string | null
): { year: number; month: number }[] {
  if (!leaseStart || !leaseEnd) return [];

  const start = new Date(leaseStart);
  const end = new Date(leaseEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const months: { year: number; month: number }[] = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1;
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth() + 1;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ year, month });
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return months;
}

function isRentalProperty(type: string) {
  return type === "PISO" || type === "CASA";
}

/** Crea, actualiza o elimina proyecciones de alquiler según los datos del contrato. */
export async function syncRentalProjections(
  db: DatabaseClient,
  propertyId: string,
  rental: RentalProjectionInput
): Promise<void> {
  const { data: existing, error: fetchError } = await db
    .from("projections")
    .select("id, year, month, amount")
    .eq("property_id", propertyId)
    .eq("description", RENTAL_AUTO_DESCRIPTION);

  if (fetchError) throw new Error(fetchError.message);

  const existingRows = existing ?? [];
  const price = rental.rental_price ? parseFloat(rental.rental_price) : NaN;
  const shouldSync =
    isRentalProperty(rental.type) &&
    rental.rental_price &&
    rental.lease_start &&
    rental.lease_end &&
    !isNaN(price) &&
    price > 0;

  if (!shouldSync) {
    if (existingRows.length > 0) {
      const { error } = await db
        .from("projections")
        .delete()
        .eq("property_id", propertyId)
        .eq("description", RENTAL_AUTO_DESCRIPTION);
      if (error) throw new Error(error.message);
    }
    return;
  }

  const expectedMonths = getLeaseMonths(rental.lease_start, rental.lease_end);
  const expectedKeys = new Set(expectedMonths.map((m) => monthKey(m.year, m.month)));
  const priceStr = price.toFixed(2);

  const toDelete = existingRows.filter(
    (row) => !expectedKeys.has(monthKey(row.year, row.month ?? 0))
  );

  for (const row of toDelete) {
    const { error } = await db.from("projections").delete().eq("id", row.id);
    if (error) throw new Error(error.message);
  }

  const existingByKey = new Map(
    existingRows
      .filter((row) => expectedKeys.has(monthKey(row.year, row.month ?? 0)))
      .map((row) => [monthKey(row.year, row.month ?? 0), row])
  );

  for (const { year, month } of expectedMonths) {
    const key = monthKey(year, month);
    const row = existingByKey.get(key);

    if (row) {
      if (parseFloat(row.amount) !== price) {
        const { error } = await db
          .from("projections")
          .update({ amount: priceStr, category: RENTAL_PROJECTION_CATEGORY })
          .eq("id", row.id);
        if (error) throw new Error(error.message);
      }
      continue;
    }

    const { error } = await db.from("projections").insert({
      id: nanoid(12),
      property_id: propertyId,
      year,
      month,
      type: "INCOME",
      category: RENTAL_PROJECTION_CATEGORY,
      amount: priceStr,
      description: RENTAL_AUTO_DESCRIPTION,
    });
    if (error) throw new Error(error.message);
  }
}
