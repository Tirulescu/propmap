import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/insforge-server";
import { loadPropertyBundle } from "@/lib/property-access";
import EditPropertyForm from "./edit-form";

export default async function EditPropertyPage(props: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const { id } = await props.params;

  const bundle = await loadPropertyBundle(
    id,
    ctx.user.id,
    ctx.user.email,
    {
      includeProjections: false,
      includeHistory: false,
      requireEdit: true,
    },
    ctx.client.database
  );

  if (!bundle) redirect("/properties");

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="font-display font-medium tracking-tight">Editar propiedad</h1>
      </div>
      <EditPropertyForm property={bundle.property} />
    </div>
  );
}
