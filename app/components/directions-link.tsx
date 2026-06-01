import { getDirectionsUrl } from "@/lib/maps-url";

interface DirectionsLinkProps {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  className?: string;
}

const directionsLinkChipClass =
  "rounded-md border border-[#C9B99A]/50 bg-[#F7F4EF]/95 px-2.5 py-1.5 text-xs shadow-[0_2px_10px_rgba(26,21,16,0.1)] backdrop-blur-sm hover:bg-[#EDE8DF] hover:no-underline";

export default function DirectionsLink({
  lat,
  lng,
  address,
  className = "",
}: DirectionsLinkProps) {
  const url = getDirectionsUrl({ lat, lng, address });
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-medium text-[#4A6E47] no-underline transition-colors hover:text-[#3a5a37]",
        directionsLinkChipClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
      Cómo llegar
    </a>
  );
}
