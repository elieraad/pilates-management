import ClassList from "@/components/classes/class-list";

export const metadata = {
  title: "Classes | Pilates Studio Management",
  description: "Manage your studio classes and sessions",
};

export default function ClassesPage() {
  return (
    <div>
      <ClassList />
    </div>
  );
}
