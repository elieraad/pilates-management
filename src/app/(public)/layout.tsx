import { ReactNode } from "react";

export const metadata = {
  title: {
    default: "Fitness Studio Booking",
    template: "%s | Fitness Studio",
  },
  description: "Book your fitness classes online",
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-olive-50">{children}</div>;
}
