export default function ActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">{children}</div>
    </div>
  );
}
