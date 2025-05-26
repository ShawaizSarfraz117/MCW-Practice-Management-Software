export default function Loading() {
  return (
    <div className="max-w-2xl animate-pulse space-y-8">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded"></div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>

      {/* Button Skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
