// app/(protected)/settings/license/page.tsx

import LicenseInfo from "@/components/settings/license-info";

export const metadata = {
  title: "License Management | Pilates Studio Management",
  description: "Manage your subscription and licensing",
};

export default function LicensePage() {
  return (
    <div>
      <h1 className="text-2xl font-serif text-olive-900">License Management</h1>
      <LicenseInfo />
    </div>
  );
}
