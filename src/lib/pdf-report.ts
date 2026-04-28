import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ReportMeta {
  schoolName: string;
  majorName: string;
  date: string;
}

/**
 * 섹션 단위로 페이지 break 를 보장하는 PDF 생성기.
 * - 직계 자식 div 를 "섹션" 으로 간주 → 각 섹션을 개별 PNG 로 캡처해 페이지에 배치
 * - 한 섹션이 한 페이지에 안 들어가면 자동 슬라이스
 * - pixelRatio 3 (Retina 수준) + Pretendard/Noto Sans KR 폰트 자동 임베딩
 *   (전역 CSS 에 폰트가 로드되어 있으면 html-to-image 가 그대로 캡처)
 *
 * fontEmbedCSS 를 직접 주입하지 않더라도 document.fonts 가 ready 된 상태이면
 * 캡처 시 글리프가 정상 렌더링됨. 본 프로젝트는 index.html 에서 Pretendard 를
 * 로드하므로 별도 임베딩 없이도 한글 폰트가 보존된다.
 */
export async function generatePdfReport(
  element: HTMLElement,
  meta: ReportMeta,
): Promise<void> {
  // 폰트 로드 보장 — Pretendard / Noto Sans KR 이 늦게 로드되면 캡처 깨짐
  type DocWithFonts = Document & { fonts?: { ready?: Promise<unknown> } };
  if (typeof document !== 'undefined') {
    const docFonts = (document as DocWithFonts).fonts;
    if (docFonts?.ready) {
      try {
        await docFonts.ready;
      } catch {
        /* ignore */
      }
    }
  }

  const pdfWidth = 210; // A4 mm
  const pdfHeight = 297;
  const margin = 10;
  const contentWidth = pdfWidth - margin * 2;
  const pageContentHeight = pdfHeight - margin * 2;

  const pdf = new jsPDF('p', 'mm', 'a4');

  // 섹션 = 최상위 컨테이너의 직계 자식 (각 카드/섹션 컴포넌트 단위)
  const sections = Array.from(element.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.offsetHeight > 0,
  );

  if (sections.length === 0) {
    // 폴백: 전체 통째로 캡처
    await renderAndAdd(pdf, element, margin, contentWidth, pageContentHeight, true);
    pdf.save(buildFilename(meta));
    return;
  }

  let cursorY = margin;
  let firstPage = true;

  for (const section of sections) {
    const dataUrl = await toPng(section, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });
    const img = await loadImage(dataUrl);
    const sliceHeightMm = contentWidth * (img.height / img.width);

    // 한 섹션이 한 페이지를 넘으면 슬라이스
    if (sliceHeightMm > pageContentHeight) {
      // 새 페이지에서 시작
      if (!firstPage && cursorY > margin) {
        pdf.addPage();
      }
      cursorY = margin;
      await sliceTallSection(pdf, img, dataUrl, margin, contentWidth, pageContentHeight);
      // 슬라이스가 끝나면 마지막 페이지가 가득 찼다고 가정 → 다음 섹션은 새 페이지
      pdf.addPage();
      cursorY = margin;
      firstPage = false;
      continue;
    }

    // 현재 페이지에 안 들어가면 새 페이지
    if (cursorY + sliceHeightMm > margin + pageContentHeight) {
      pdf.addPage();
      cursorY = margin;
    }

    pdf.addImage(dataUrl, 'PNG', margin, cursorY, contentWidth, sliceHeightMm);
    cursorY += sliceHeightMm + 2; // 섹션 간 간격 2mm
    firstPage = false;
  }

  pdf.save(buildFilename(meta));
}

function buildFilename(meta: ReportMeta): string {
  const safe = (s: string) => s.replace(/[\\/:*?"<>|\s]+/g, '_');
  return `학점나비_${safe(meta.schoolName)}_${safe(meta.majorName)}_${meta.date}.pdf`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderAndAdd(
  pdf: jsPDF,
  element: HTMLElement,
  margin: number,
  contentWidth: number,
  pageContentHeight: number,
  firstPage: boolean,
): Promise<void> {
  const dataUrl = await toPng(element, { pixelRatio: 3, backgroundColor: '#ffffff' });
  const img = await loadImage(dataUrl);
  const sliceHeightMm = contentWidth * (img.height / img.width);

  if (sliceHeightMm <= pageContentHeight) {
    pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, sliceHeightMm);
    return;
  }
  if (!firstPage) pdf.addPage();
  await sliceTallSection(pdf, img, dataUrl, margin, contentWidth, pageContentHeight);
}

async function sliceTallSection(
  pdf: jsPDF,
  img: HTMLImageElement,
  _dataUrl: string,
  margin: number,
  contentWidth: number,
  pageContentHeight: number,
): Promise<void> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const scale = img.width / contentWidth; // px per mm
  const sliceHeightPx = pageContentHeight * scale;
  let yOffset = 0;
  let firstSlice = true;

  while (yOffset < img.height) {
    if (!firstSlice) pdf.addPage();
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
    firstSlice = false;
  }
}
