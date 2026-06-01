import { Spinner, type SpinnerSize } from "./spinner";

interface LoadingLabelProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  spinnerSize?: SpinnerSize;
}

export function LoadingLabel({
  loading,
  children,
  loadingText,
  spinnerSize = "sm",
}: LoadingLabelProps) {
  if (!loading) return <>{children}</>;

  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner size={spinnerSize} />
      <span>{loadingText ?? children}</span>
    </span>
  );
}
