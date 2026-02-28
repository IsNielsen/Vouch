import { Upload } from "lucide-react";
import Link from "next/link";

export function UploadFeature() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-5">
          <h2 className="text-4xl font-bold leading-tight">
            Close deals the moment you&apos;re in the room.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Upload your document once. When you&apos;re face-to-face with a
            client, show them the QR code or tap NFC — they verify with their
            device biometrics and it&apos;s signed. No printing, no chasing
            emails, no waiting.
          </p>
          <Link
            href="/early-access"
            className="w-fit px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-accent transition-colors"
          >
            Try It Free
          </Link>
        </div>
        <div className="border-2 border-dashed border-primary/30 rounded-2xl bg-muted/20 flex flex-col items-center justify-center gap-4 py-16 px-8">
          <Upload className="w-12 h-12 text-primary/50" />
          <p className="text-muted-foreground text-sm">
            Drag &amp; drop your PDF here
          </p>
          <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors">
            Upload Document
          </button>
        </div>
      </div>
    </section>
  );
}
