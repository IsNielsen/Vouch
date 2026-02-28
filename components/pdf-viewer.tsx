"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(0);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setWidth(node.clientWidth);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-2 overflow-y-auto">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div className="h-[60dvh] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>}
        error={<div className="h-[60dvh] flex items-center justify-center text-sm text-muted-foreground">Unable to load document.</div>}
      >
        <Page
          pageNumber={page}
          width={width || undefined}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>

      {numPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground">{page} / {numPages}</span>
          <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(numPages, p + 1))} disabled={page === numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
