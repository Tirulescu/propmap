"use client";

import DirectionsLink from "@/app/components/directions-link";
import { hasSavedLocation } from "@/lib/maps-url";

interface PropertyLocationProps {
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export default function PropertyLocation({ address, lat, lng }: PropertyLocationProps) {
  const hasLocation = hasSavedLocation(lat, lng) || !!address?.trim();

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start gap-2">
        <span className="text-lg mt-0.5" aria-hidden="true">
          📍
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-0.5">
            Ubicación
          </div>
          <p className="text-[#1A1510] leading-relaxed">{address || "—"}</p>
          {!hasLocation && (
            <p className="text-sm text-[#9E8F7B] mt-1.5">Sin ubicación registrada.</p>
          )}
          {hasLocation && (
            <div className="mt-2 flex justify-end">
              <DirectionsLink lat={lat} lng={lng} address={address} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
