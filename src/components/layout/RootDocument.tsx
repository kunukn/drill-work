import { HeadContent, Scripts } from "@tanstack/react-router";

export function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-gray-50 min-h-screen font-sans">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
