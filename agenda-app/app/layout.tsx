import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// All routes require authentication — disable static prerendering globally.
// Prevents "Cannot read properties of null (reading 'useContext')" at build
// time when next/navigation hooks (usePathname, useRouter) are bundled into
// the server chunk but React's client dispatcher is not yet initialised.
export const dynamic = "force-dynamic";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Agenda Ejecutiva",
  description: "Asistente IA de agenda personal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
