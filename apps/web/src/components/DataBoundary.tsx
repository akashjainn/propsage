type Props = {
  status: "loading" | "error" | "success";
  error?: unknown;
  empty?: boolean;
  children?: React.ReactNode;
};

export function DataBoundary({ status, error, empty, children }: Props) {
  if (status === "loading") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-lg border bg-white p-4 animate-pulse" />
        ))}
      </div>
    );
  }
  if (status === "error") {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        <div className="font-medium">Something went wrong.</div>
        <div className="text-sm text-red-800 mt-1">{msg}</div>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-6 text-center">
        <div className="text-gray-800 font-medium">No data yet</div>
        <div className="text-gray-500 text-sm mt-1">
          Try again shortly or verify your environment variables.
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
