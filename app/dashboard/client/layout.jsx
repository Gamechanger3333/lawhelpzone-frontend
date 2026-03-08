import DashboardLayout from "@/app/components/DashboardLayout";

export default function ClientLayout({ children }) {
  return <DashboardLayout role="client">{children}</DashboardLayout>;
}