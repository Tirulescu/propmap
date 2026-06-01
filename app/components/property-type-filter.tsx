"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyType } from "@/lib/db/types";
import {
  PROPERTY_TYPE_EMOJI,
  PROPERTY_TYPE_LABEL,
  PROPERTY_TYPE_OPTIONS,
} from "@/lib/property-types";

function getTypeFilterLabel(selectedTypes: PropertyType[]): string {
  if (selectedTypes.length === 0) return "Todos los tipos";
  if (selectedTypes.length === 1) {
    return PROPERTY_TYPE_LABEL[selectedTypes[0]] ?? "Filtrar";
  }
  return `${selectedTypes.length} tipos`;
}

interface PropertyTypeFilterProps {
  selectedTypes: PropertyType[];
  onSelectedTypesChange: (types: PropertyType[]) => void;
  popoverClassName?: string;
}

export default function PropertyTypeFilter({
  selectedTypes,
  onSelectedTypesChange,
  popoverClassName = "z-50",
}: PropertyTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hasTypeFilter = selectedTypes.length > 0;
  const buttonLabel = getTypeFilterLabel(selectedTypes);

  const toggleType = (type: PropertyType) => {
    onSelectedTypesChange(
      selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type]
    );
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`pill-btn pill-btn-inactive gap-1.5 px-2.5 py-2 text-sm h-10 ${
          hasTypeFilter ? "ring-1 ring-[#4A6E47]/35" : ""
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M2 4h12M4 8h8M6 12h4" />
        </svg>
        <span className="hidden max-w-[6.5rem] truncate sm:inline">{buttonLabel}</span>
        {hasTypeFilter && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4A6E47] px-1 text-[10px] font-medium text-white sm:hidden">
            {selectedTypes.length}
          </span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Filtrar por tipo de propiedad"
          className={`absolute right-0 top-full mt-2 pill-group pill-group-solid animate-fade-in ${popoverClassName}`}
        >
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={selectedTypes.includes(opt.value)}
              onClick={() => toggleType(opt.value)}
              className={`pill-btn justify-start ${
                selectedTypes.includes(opt.value) ? "pill-btn-active" : "pill-btn-inactive"
              }`}
            >
              <span aria-hidden="true">{PROPERTY_TYPE_EMOJI[opt.value]}</span>
              {opt.label}
            </button>
          ))}
          {selectedTypes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onSelectedTypesChange([]);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-[#B54A35] hover:bg-[#B54A35]/5 rounded-md transition-colors"
            >
              Limpiar selección
            </button>
          )}
        </div>
      )}
    </div>
  );
}
