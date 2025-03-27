// Style Imports
import "./globals.css";
import "@mcw/ui/styles.css";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  // Vars
  const direction = "ltr";

  return (
    <html dir={direction} id="__next" lang="en">
      <body className="flex is-full min-bs-full flex-auto flex-col">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
