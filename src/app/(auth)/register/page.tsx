import RegisterForm from "@/components/auth/register-form";

export const metadata = {
  title: "Register | Pilates Studio Management",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
