import type { Metadata } from "next";
import "./globals.css";
import "@/components/reservation/reservation.css";
import { Providers } from "./providers";
import { getEsubDetails } from "@/lib/apartments";

export const metadata: Metadata = {
  title: "Myxellia",
  description: "Explore apartments, floor plans, and interiors at Myxellia.",
  icons: { icon: "/assets/logo.svg" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const esubDetails = await getEsubDetails();

  return (
    <html lang="en">
      <body>
        <Providers esubDetails={esubDetails}>{children}</Providers>
      </body>
    </html>
  );
}
