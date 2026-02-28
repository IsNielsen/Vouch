"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

async function downloadBlob(url: string, fileName: string) {
  const blob = await fetch(url).then((r) => r.blob());
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

export function DownloadButton({ url, fileName }: { url: string; fileName: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => downloadBlob(url, fileName)}>
      <Download className="h-4 w-4 mr-2" />
      Download
    </Button>
  );
}
