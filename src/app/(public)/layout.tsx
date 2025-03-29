import { ReactNode } from "react";

export const metadata = {
  title: {
    default: "Pilates Studio Booking",
    template: "%s | Pilates Studio",
  },
  description: "Book your pilates classes online",
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-olive-50">{children}</div>;
}
