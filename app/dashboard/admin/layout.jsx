import DashboardLayout from "@/app/components/DashboardLayout";

export default function AdminLayout({ children }) {
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}


