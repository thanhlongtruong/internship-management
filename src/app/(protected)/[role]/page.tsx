import { Role } from "@/lib/types";

export default async function RoleDashboardPage({
  params,
}: {
  params: Promise<{ role: Role }>;
}) {
  const { role } = await params;
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-lg">
        Chào mừng bạn đến với trang quản trị dành cho{" "}
        <span className="uppercase font-semibold">{role}</span>.
      </p>
    </div>
  );
}
