import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { DocumentType } from "@mcw/types";
import { useClientOverview } from "@/(dashboard)/clients/[id]/hooks/useClientOverview";
import ChartNoteEditor from "./components/ChartNoteEditor";
import DateRangeFilterControls from "./components/DateRangeFilterControls";
import NavigationDropdown from "./components/NavigationDropdown";
import TimelineItem from "./components/TimelineItem";

export default function OverviewTab() {
  const params = useParams();
  const [filterType, setFilterType] = useState<DocumentType | "all">("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useClientOverview({
    clientGroupId: params.id as string,
    startDate,
    endDate,
    itemType: filterType,
  });

  // Set up intersection observer for infinite scrolling
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Flatten the pages data
  const documents = data?.pages?.flatMap((page) => page.data) || [];

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      <ChartNoteEditor />

      {/* Date Range and Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <DateRangeFilterControls
          endDate={endDate}
          filterType={filterType}
          setFilterType={setFilterType}
          startDate={startDate}
          onDateRangeChange={handleDateRangeChange}
        />
        <NavigationDropdown />
      </div>

      {/* Timeline */}
      {isLoading ? (
        <Loading message="Loading timeline..." />
      ) : error ? (
        <div className="text-red-500 text-center py-8">
          {error instanceof Error ? error.message : "Failed to load documents"}
        </div>
      ) : (
        <div className="space-y-4">
          {documents.length > 0 ? (
            <>
              {documents.map((document, index) => (
                <div
                  key={`${document.id}-${index}`}
                  ref={
                    index === documents.length - 1 ? lastElementRef : undefined
                  }
                >
                  <TimelineItem document={document} />
                </div>
              ))}
              {isFetchingNextPage && (
                <div className="py-4">
                  <Loading message="Loading more..." />
                </div>
              )}
              {!hasNextPage && documents.length > 0 && (
                <div className="text-center text-gray-500 py-4">
                  No more documents to load
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No documents found for the selected filters
            </div>
          )}
        </div>
      )}
    </div>
  );
}
