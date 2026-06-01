"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import PropertyHistory from "./property-history";
import PropertyLocation from "./property-location";
import PropertyDocumentsPanel from "./property-documents-panel";
import PropertyPhotos from "./property-photos";
import { formatDate } from "@/lib/format-date";
import type { DbPropertyHistory } from "@/lib/db/types";
import type { PropertyRole } from "@/lib/property-access";
import PropertySharePanel from "./property-share-panel";

const PropertyMapViewDynamic = dynamic(() => import("./property-map-view"), {
  ssr: false,
  loading: () => <TabPanelSkeleton minHeight="min-h-[280px]" />,
});

const PropertyFinanceDynamic = dynamic(() => import("./property-finance"), {
  ssr: false,
  loading: () => <TabPanelSkeleton minHeight="min-h-[200px]" />,
});

function TabPanelSkeleton({ minHeight = "min-h-[160px]" }: { minHeight?: string }) {
  return (
    <div
      className={`card ${minHeight} animate-pulse bg-[#E8DCC4]/25`}
      aria-hidden="true"
    />
  );
}

function TabPanel({
  tabKey,
  activeTab,
  visited,
  panelId,
  children,
}: {
  tabKey: TabKey;
  activeTab: TabKey;
  visited: Set<TabKey>;
  panelId: string;
  children: ReactNode;
}) {
  if (!visited.has(tabKey)) return null;
  const active = activeTab === tabKey;
  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={`tab-${tabKey}`}
      hidden={!active}
      className={active ? undefined : "hidden"}
    >
      {children}
    </div>
  );
}

const tabs = [
  { key: "info",    label: "Información",   shortLabel: "Info",     icon: "ℹ️" },
  { key: "map",     label: "Mapa",          shortLabel: "Mapa",     icon: "🗺️" },
  { key: "finance", label: "Finanzas",      shortLabel: "Finanzas", icon: "📊" },
  { key: "photos",  label: "Fotos",         shortLabel: "Fotos",    icon: "📷" },
  { key: "docs",    label: "Documentación", shortLabel: "Docs",     icon: "📄" },
  { key: "share",   label: "Compartir",     shortLabel: "Acceso",   icon: "👥" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function PropertyDetail({
  property,
  projections,
  history,
  accessRole,
}: {
  property: any;
  projections: any[];
  history: DbPropertyHistory[];
  accessRole: PropertyRole;
}) {
  const [tab, setTab] = useState<TabKey>("info");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(() => new Set(["info"]));
  const isOwner = accessRole === "OWNER";
  const canEdit = accessRole === "OWNER" || accessRole === "EDITOR";
  const visibleTabs = tabs.filter((t) => t.key !== "share" || isOwner);

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [tab]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void import("./property-map-view");
      void import("./property-finance");
    }, 400);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (tab === "share" && !isOwner) setTab("info");
  }, [tab, isOwner]);

  const selectTab = useCallback((key: TabKey) => {
    setTab(key);
    requestAnimationFrame(() => {
      const el = document.getElementById(`tab-${key}`);
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const narrow = window.matchMedia("(max-width: 767px)").matches;
      if (narrow) {
        el.scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: reduced ? "auto" : "smooth",
        });
      }
    });
  }, []);

  return (
    <div className="animate-fade-in min-w-0 max-w-full">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5 w-full">
        <h1 className="font-display font-medium tracking-tight min-w-0 flex-1">
          {property.name}
        </h1>
        {isOwner && (
          <span className="badge bg-[#E8DCC4] text-[#4A6E47] w-fit animate-stamp shrink-0">
            Propietario
          </span>
        )}
        {!isOwner && accessRole === "EDITOR" && (
          <span className="badge bg-[#E8DCC4]/60 text-[#4A6E47] w-fit shrink-0">
            Edición
          </span>
        )}
        {!isOwner && accessRole === "VIEWER" && (
          <span className="badge bg-[#EDE8DF] text-[#6B5E4E] w-fit shrink-0">
            Lectura
          </span>
        )}
        {canEdit && (
          <Link
            href={`/properties/${property.id}/edit`}
            className="ml-auto shrink-0 rounded-lg border border-[#C9B99A] px-3 py-1.5 text-sm text-[#6B5E4E] no-underline hover:text-[#4A6E47] hover:border-[#4A6E47] transition-colors inline-flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </Link>
        )}
      </div>

      <div className="mb-5 min-w-0">
        <div
          className="pill-group pill-group-scroll w-full max-w-full md:w-fit"
          role="tablist"
          aria-label="Secciones de la propiedad"
        >
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              aria-label={t.label}
              onClick={() => selectTab(t.key)}
              className={`pill-btn ${tab === t.key ? "pill-btn-active" : "pill-btn-inactive"}`}
            >
              <span aria-hidden="true">{t.icon}</span>
              <span className="sm:hidden">{t.shortLabel}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <TabPanel tabKey="info" activeTab={tab} visited={visitedTabs} panelId="panel-info">
          <InfoTab
            property={property}
            history={history}
            propertyId={property.id}
            canEdit={canEdit}
          />
        </TabPanel>

        <TabPanel tabKey="map" activeTab={tab} visited={visitedTabs} panelId="panel-map">
          <PropertyMapViewDynamic
            lat={property.location_lat}
            lng={property.location_lng}
            geoPolygon={property.geo_polygon}
            address={property.address}
          />
        </TabPanel>

        <TabPanel tabKey="finance" activeTab={tab} visited={visitedTabs} panelId="panel-finance">
          <PropertyFinanceDynamic propertyId={property.id} projections={projections} />
        </TabPanel>

        <TabPanel tabKey="photos" activeTab={tab} visited={visitedTabs} panelId="panel-photos">
          <PropertyPhotos propertyId={property.id} editable={canEdit} />
        </TabPanel>

        <TabPanel tabKey="docs" activeTab={tab} visited={visitedTabs} panelId="panel-docs">
          <PropertyDocumentsPanel propertyId={property.id} editable={canEdit} />
        </TabPanel>

        {isOwner && (
          <TabPanel tabKey="share" activeTab={tab} visited={visitedTabs} panelId="panel-share">
            <PropertySharePanel propertyId={property.id} />
          </TabPanel>
        )}
      </div>
    </div>
  );
}

function InfoTab({
  property,
  history,
  propertyId,
  canEdit,
}: {
  property: any;
  history: DbPropertyHistory[];
  propertyId: string;
  canEdit: boolean;
}) {
  const infoBlocks = [];

  if (property.type === "MONTE") {
    infoBlocks.push(
      {
        title: "Datos del Monte",
        icon: "🌲",
        items: [
          { label: "Plantado", value: formatDate(property.planted_date) },
          { label: "Especie", value: property.species || "—" },
          { label: "Última tala", value: formatDate(property.last_harvest_date) },
        ],
      }
    );
  }

  if (property.type === "PISO" || property.type === "CASA") {
    infoBlocks.push(
      {
        title: "Datos de Alquiler",
        icon: "🔑",
        items: [
          { label: "Precio", value: property.rental_price ? `€${property.rental_price}/mes` : "—" },
          { label: "Inquilino", value: property.tenant_name || "—" },
          { label: "Email", value: property.tenant_email || "—" },
          { label: "Teléfono", value: property.tenant_phone || "—" },
          { label: "Contrato", value: `${formatDate(property.lease_start)} — ${formatDate(property.lease_end)}` },
        ],
      }
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">📍</span>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-0.5">Tipo</div>
              <div className="text-[#1A1510]">{property.type}</div>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <span className="text-lg mt-0.5">📋</span>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-0.5">Ref. Catastro</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#1A1510]">{property.catastro_ref || "—"}</span>
                {property.catastro_url && (
                  <a href={property.catastro_url} target="_blank" className="inline-flex items-center gap-1 text-xs text-[#4A6E47] underline">
                    Ver en Catastro
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 2h4v4M10 2L5 7M3 9l-1 1" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PropertyLocation
        address={property.address}
        lat={property.location_lat}
        lng={property.location_lng}
      />

      {infoBlocks.map((block) => (
        <div key={block.title} className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{block.icon}</span>
            <h3 className="font-semibold text-[#1A1510]">{block.title}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {block.items.map((item) => (
              <div key={item.label}>
                <div className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-0.5">{item.label}</div>
                <div className="text-[#1A1510]">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {property.notes && (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📝</span>
            <span className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium">Notas</span>
          </div>
          <p className="text-[#1A1510] leading-relaxed whitespace-pre-wrap">{property.notes}</p>
        </div>
      )}

      <PropertyHistory propertyId={propertyId} entries={history} editable={canEdit} />
    </div>
  );
}
