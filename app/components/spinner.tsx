const sizeClasses = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-2",
} as const;

export type SpinnerSize = keyof typeof sizeClasses;

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

export function Spinner({ size = "md", className = "", label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label ?? "Cargando"}
      className={`inline-block shrink-0 rounded-full border-[#C9B99A] border-t-[#4A6E47] animate-spin ${sizeClasses[size]} ${className}`}
    />
  );
}
