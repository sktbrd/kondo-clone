import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Kondo Clone",
  description: "Batch swap tokens on Base",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "/og.png",
      button: {
        title: "Launch App",
        action: {
          type: "launch_frame",
          name: "Kondo Clone",
          url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          splashImageUrl: "/icon.png",
          splashBackgroundColor: "#5C36D6",
        },
      },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
