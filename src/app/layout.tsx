import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import Providers from "@/components/providers";
import SubtleNavigationFeedback from "@/components/ui/navigation-feedback";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Pilates Studio Management",
    template: "%s | Pilates Studio Management",
  },
  description: "A complete studio management platform for Pilates studios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <SubtleNavigationFeedback />
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
