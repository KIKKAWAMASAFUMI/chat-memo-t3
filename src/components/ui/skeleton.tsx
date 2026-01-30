interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  );
}

export function SnippetListSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 rounded-lg">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <div className="flex gap-1 mb-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function MemoContentSkeleton() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[#f9f7f2]">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 lg:hidden" />
        <Skeleton className="h-7 flex-1 max-w-xs" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </header>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                i % 2 === 0 ? "bg-orange-100" : "bg-white"
              }`}
            >
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        ))}
      </div>

      {/* Input Skeleton */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-24 rounded-xl" />
          <Skeleton className="h-10 w-14 rounded-xl" />
        </div>
      </div>
    </main>
  );
}

export function MessageSkeleton() {
  return (
    <div className="animate-pulse flex gap-3 p-4">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
