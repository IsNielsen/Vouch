import Link from "next/link";
import { Code2 } from "lucide-react";

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/protected/api-test"
          className="flex items-center gap-4 p-6 rounded-lg border hover:bg-accent transition-colors"
        >
          <Code2 size={28} />
          <div>
            <p className="font-semibold text-lg">API Console</p>
            <p className="text-sm text-muted-foreground">
              Generate API keys and test the Vouch API
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
