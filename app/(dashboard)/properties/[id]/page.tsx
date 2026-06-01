import PropertyPageContent from "./property-page-content";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyPage(props: PageProps) {
  const { id } = await props.params;
  return <PropertyPageContent id={id} />;
}
