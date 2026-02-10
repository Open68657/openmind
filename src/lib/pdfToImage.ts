import * as pdfjsLib from "pdfjs-dist";

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Renders the first page of a PDF file to a JPEG image.
 * This runs entirely in the browser, avoiding server memory issues.
 */
export async function pdfToImage(pdfFile: File, maxDimension = 2048): Promise<File> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(maxDimension / viewport.width, maxDimension / viewport.height, 2);
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85);
  });

  const name = pdfFile.name.replace(/\.pdf$/i, ".jpg");
  return new File([blob], name, { type: "image/jpeg" });
}
