import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { normalizeEmail, type ShareRole } from "@/lib/property-access";
import { requirePropertyAccess } from "@/lib/property-api-auth";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "manageShares");
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("property_shares")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json((data ?? []).filter((s) => s.shared_with_email));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePropertyAccess(id, "manageShares");
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const email = normalizeEmail(String(body.email || ""));
  const role = (body.role === "EDITOR" ? "EDITOR" : "VIEWER") as ShareRole;

  if (!isValidEmail(email)) {
    return Response.json({ error: "Correo electrónico no válido" }, { status: 400 });
  }

  if (email === normalizeEmail(auth.session.user.email)) {
    return Response.json({ error: "No puedes compartir contigo mismo" }, { status: 400 });
  }

  const { data: existing } = await auth.db
    .from("property_shares")
    .select("id")
    .eq("property_id", id)
    .eq("shared_with_email", email)
    .maybeSingle();

  if (existing) {
    return Response.json({ error: "Esta persona ya tiene acceso a la propiedad" }, { status: 409 });
  }

  const share = {
    id: nanoid(12),
    property_id: id,
    shared_by_id: auth.session.user.id,
    shared_with_email: email,
    role,
  };

  const { data, error } = await auth.db
    .from("property_shares")
    .insert(share)
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
