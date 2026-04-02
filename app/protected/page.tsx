import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Home</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/protected/dashboard"
          className="flex items-center gap-4 p-6 rounded-lg border hover:bg-accent transition-colors"
        >
          <LayoutDashboard size={28} />
          <div>
            <p className="font-semibold text-lg">Developer Dashboard</p>
            <p className="text-sm text-muted-foreground">
              Manage API keys, view verifications and audit log
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
