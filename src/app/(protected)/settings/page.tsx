import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/settings/profile-form";
import BookingShareComponent from "@/components/settings/bookings-share";

export const metadata = {
  title: "Settings | Pilates Studio Management",
  description: "Manage your studio profile and settings",
};

export default async function SettingsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Get the current user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Get the studio profile
  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-serif text-olive-900">Studio Profile</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-serif text-olive-900 mb-6">
          Public Booking
        </h2>
        <BookingShareComponent />
        <h2 className="text-xl font-serif text-olive-900 mb-6">Edit Profile</h2>
        {studio && <ProfileForm initialData={studio} />}
      </div>
    </div>
  );
}
