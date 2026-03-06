import { PDFDocument, StandardFonts } from "pdf-lib";

export async function fillPdfFields(
  pdfBytes: ArrayBuffer,
  { signerName, signedAt }: { signerName: string; signedAt: Date }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const dateStr = signedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Pass 1 — AcroForm fields
  let form: ReturnType<typeof pdfDoc.getForm> | null = null;
  type PDFField = ReturnType<ReturnType<typeof pdfDoc.getForm>["getFields"]>[number];
  let fields: PDFField[] = [];
  try {
    form = pdfDoc.getForm();
    fields = form.getFields();
  } catch {
    // no form
  }

  if (fields.length > 0) {
    const { PDFTextField } = await import("pdf-lib");
    for (const field of fields) {
      if (!(field instanceof PDFTextField)) continue;
      const name = field.getName().toLowerCase();
      if (/sign/.test(name)) {
        field.setText(signerName);
      } else if (/date/.test(name)) {
        field.setText(dateStr);
      } else if (/name|print/.test(name)) {
        field.setText(signerName);
      }
    }
    form!.flatten();
    return pdfDoc.save();
  }

  // Pass 2 — Visual heuristic: scan raw bytes for text blocks near keywords
  const rawBytes = new Uint8Array(pdfBytes);
  const raw = Buffer.from(rawBytes).toString("binary");

  // Find BT...ET blocks
  const btBlocks: string[] = [];
  let pos = 0;
  while (true) {
    const btIdx = raw.indexOf("BT", pos);
    if (btIdx === -1) break;
    const etIdx = raw.indexOf("ET", btIdx);
    if (etIdx === -1) break;
    btBlocks.push(raw.slice(btIdx, etIdx + 2));
    pos = etIdx + 2;
  }

  const keywords = /signature|date|printed\s+name|sign\s+here/i;
  const fillTargets: { page: number; x: number; y: number; text: string }[] = [];

  // Map pages by their content streams (heuristic: assume pages in order)
  const pages = pdfDoc.getPages();

  for (const block of btBlocks) {
    if (!keywords.test(block)) continue;

    // Extract last Td/Tm coordinates
    const tmMatch = [...block.matchAll(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+Td|(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+Tm/g)].pop();
    if (!tmMatch) continue;

    let x: number, y: number;
    if (tmMatch[1] !== undefined) {
      x = parseFloat(tmMatch[1]);
      y = parseFloat(tmMatch[2]);
    } else {
      // Tm: a b c d e f — e=x, f=y
      x = parseFloat(tmMatch[7]);
      y = parseFloat(tmMatch[8]);
    }

    // Determine which value to fill based on keyword match
    const isDate = /date/i.test(block);
    const fillText = isDate ? dateStr : signerName;

    // Use page 0 as fallback (heuristic — good enough for single-page docs)
    fillTargets.push({ page: 0, x, y, text: fillText });
  }

  if (fillTargets.length === 0) {
    // No visual fields found, return original
    return new Uint8Array(pdfBytes);
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;

  for (const { page: pageIdx, x, y, text } of fillTargets) {
    const page = pages[pageIdx];
    if (!page) continue;
    page.drawText(text, {
      x: x,
      y: y + 2, // slightly above baseline
      size: fontSize,
      font,
    });
  }

  return pdfDoc.save();
}
