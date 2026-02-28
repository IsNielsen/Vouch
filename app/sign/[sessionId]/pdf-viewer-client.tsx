"use client";

import dynamic from "next/dynamic";

export const PdfViewerClient = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfViewer),
  { ssr: false }
);
