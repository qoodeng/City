export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-city-surface animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded bg-city-surface animate-pulse" />
          <div className="h-9 w-24 rounded bg-city-surface animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3 p-4 border border-border rounded-lg bg-card/50">
            <div className="flex justify-between items-start">
              <div className="h-5 w-3/4 rounded bg-city-surface animate-pulse" />
              <div className="h-5 w-5 rounded-full bg-city-surface animate-pulse" />
            </div>
            <div className="h-4 w-full rounded bg-city-surface animate-pulse" />
            <div className="flex gap-2 mt-2">
              <div className="h-5 w-16 rounded-full bg-city-surface animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-city-surface animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
