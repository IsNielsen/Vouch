import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function appendCertificatePage(
  pdfBytes: ArrayBuffer,
  data: {
    fileName: string;
    documentHash: string;
    sessionId: string;
    signers: { email: string; signedAt: string; credentialId: string }[];
    verifyUrl: string;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.8, 0.8, 0.8);
  const green = rgb(0.12, 0.5, 0.18);

  let y = height - 48;

  // Top rule
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 1.5, color: black });

  y -= 28;
  page.drawText("SIGNATURE CERTIFICATE  ·  VOUCH", {
    x: 48, y, font: helveticaBold, size: 13, color: black,
  });

  y -= 36;
  page.drawText("Document", { x: 48, y, font: helvetica, size: 9, color: gray });

  y -= 14;
  const maxWidth = width - 96;
  let displayName = data.fileName;
  while (helveticaBold.widthOfTextAtSize(displayName, 11) > maxWidth && displayName.length > 10) {
    displayName = displayName.slice(0, -4) + "…";
  }
  page.drawText(displayName, { x: 48, y, font: helveticaBold, size: 11, color: black });

  y -= 20;
  page.drawText("SHA-256 hash of original document", { x: 48, y, font: helvetica, size: 8, color: gray });

  y -= 13;
  // Show full hash in two lines if needed
  const hash = data.documentHash;
  const half = Math.ceil(hash.length / 2);
  page.drawText(hash.slice(0, half), { x: 48, y, font: helvetica, size: 8, color: gray });
  if (hash.length > half) {
    y -= 12;
    page.drawText(hash.slice(half), { x: 48, y, font: helvetica, size: 8, color: gray });
  }

  y -= 28;
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 0.5, color: lightGray });

  y -= 24;
  page.drawText(
    data.signers.length === 0
      ? "SIGNERS (none)"
      : `SIGNERS (${data.signers.length})`,
    { x: 48, y, font: helveticaBold, size: 9, color: gray }
  );

  for (const signer of data.signers) {
    y -= 22;
    page.drawText(signer.email, { x: 48, y, font: helveticaBold, size: 10, color: black });

    y -= 14;
    const dt = new Date(signer.signedAt).toUTCString();
    page.drawText(dt, { x: 48, y, font: helvetica, size: 9, color: gray });

    y -= 13;
    page.drawText("WebAuthn Passkey · Post-Quantum Secured (ML-DSA-65)", {
      x: 48, y, font: helvetica, size: 9, color: green,
    });

    y -= 18;
    page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 0.5, color: lightGray });
  }

  // Footer
  const footerY = 48;
  page.drawLine({
    start: { x: 48, y: footerY + 20 },
    end: { x: width - 48, y: footerY + 20 },
    thickness: 0.5,
    color: lightGray,
  });
  page.drawText(`Verify at: ${data.verifyUrl}`, { x: 48, y: footerY + 8, font: helvetica, size: 8, color: gray });
  page.drawText(
    "The ML-DSA-65 cryptographic signature covers the original document hash shown above, not this certificate page.",
    { x: 48, y: footerY - 4, font: helvetica, size: 7.5, color: gray }
  );

  return pdfDoc.save();
}
