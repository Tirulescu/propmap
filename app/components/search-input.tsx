"use client";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label"?: string;
  onSubmit?: () => void;
  autoComplete?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  onSubmit,
  autoComplete = "off",
}: SearchInputProps) {
  return (
    <div className="search-field">
      <svg
        className="search-field-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" />
      </svg>
      <input
        type="search"
        className="search-field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}
