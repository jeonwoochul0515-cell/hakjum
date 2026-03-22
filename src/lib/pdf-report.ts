import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ReportMeta {
  schoolName: string;
  majorName: string;
  date: string;
}

export async function generatePdfReport(
  element: HTMLElement,
  meta: ReportMeta
): Promise<void> {
  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const pdfWidth = 210; // A4 mm
  const pdfHeight = 297;
  const margin = 10;
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = contentWidth * (img.height / img.width);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageContentHeight = pdfHeight - margin * 2;

  if (contentHeight <= pageContentHeight) {
    // 한 페이지에 들어감
    pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, contentHeight);
  } else {
    // 여러 페이지: canvas로 이미지를 슬라이스
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const scale = img.width / contentWidth; // px per mm
    const sliceHeightPx = pageContentHeight * scale;
    let yOffset = 0;
    let page = 0;

    while (yOffset < img.height) {
      if (page > 0) pdf.addPage();

      const remainingPx = img.height - yOffset;
      const currentSlicePx = Math.min(sliceHeightPx, remainingPx);

      canvas.width = img.width;
      canvas.height = currentSlicePx;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, -yOffset);

      const sliceDataUrl = canvas.toDataURL('image/png');
      const sliceHeight = currentSlicePx / scale;
      pdf.addImage(sliceDataUrl, 'PNG', margin, margin, contentWidth, sliceHeight);

      yOffset += currentSlicePx;
      page++;
      if (page > 20) break; // safety
    }
  }

  const filename = `학점나비_${meta.schoolName}_${meta.majorName}_${meta.date}.pdf`;
  pdf.save(filename);
}
