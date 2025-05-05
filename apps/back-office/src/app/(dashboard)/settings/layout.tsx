import ProfileSidebar from "./components/sidebar";

// Note: We'll modify ProfileSidebar in the next step to handle its own active state
// based on the URL, so we won't pass activeSection or onSectionChange props here.

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 h-full"> {/* Ensure flex container fills height */}
      {/* Settings Sub-navigation */}
      <ProfileSidebar />

      {/* Content Area for the specific setting page */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto"> {/* Add padding and scrolling */}
        {children}
      </div>
    </div>
  );
} 