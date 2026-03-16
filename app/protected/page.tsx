import Link from "next/link";
import { Upload, FileCheck, Code2 } from "lucide-react";

export default function ProtectedPage() {

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/protected/upload"
          className="flex items-center gap-4 p-6 rounded-lg border hover:bg-accent transition-colors"
        >
          <Upload size={28} />
          <div>
            <p className="font-semibold text-lg">Upload Document</p>
            <p className="text-sm text-muted-foreground">
              Get a document signed via QR code
            </p>
          </div>
        </Link>
        <Link
          href="/protected/signed"
          className="flex items-center gap-4 p-6 rounded-lg border hover:bg-accent transition-colors"
        >
          <FileCheck size={28} />
          <div>
            <p className="font-semibold text-lg">Signed Documents</p>
            <p className="text-sm text-muted-foreground">
              View and download completed signatures
            </p>
          </div>
        </Link>
        <Link
          href="/protected/api-test"
          className="flex items-center gap-4 p-6 rounded-lg border hover:bg-accent transition-colors"
        >
          <Code2 size={28} />
          <div>
            <p className="font-semibold text-lg">API Console</p>
            <p className="text-sm text-muted-foreground">
              Generate API keys and test the Vouch-Link API
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
