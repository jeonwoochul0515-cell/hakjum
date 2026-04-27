import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { C } from '@/lib/design-tokens';
import {
  saveUploadedCurriculum,
  type UploadedCurriculum,
  type UploadedCurriculumSubject,
} from '@/lib/curriculum-storage';

type Phase = 'idle' | 'reading' | 'extracting' | 'analyzing' | 'done' | 'error';

export default function CurriculumUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [schoolName, setSchoolName] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [subjects, setSubjects] = useState<UploadedCurriculumSubject[]>([]);
  const [meta, setMeta] = useState<UploadedCurriculum['meta'] | null>(null);

  const canSubmit = schoolName.trim().length >= 2 && phase === 'idle';

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFile = useCallback(
    async (file: File) => {
      if (!schoolName.trim()) {
        setErrorMsg('학교 이름을 먼저 입력해주세요.');
        return;
      }
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('PDF 파일만 업로드할 수 있어요.');
        return;
      }
      setFileName(file.name);
      setErrorMsg('');
      setSubjects([]);
      setMeta(null);

      try {
        // ── 1단계: 파일 읽기 ──
        setPhase('reading');
        const buffer = await file.arrayBuffer();

        // ── 2단계: pdfjs-dist로 텍스트 추출 ──
        setPhase('extracting');
        const pdfText = await extractPdfText(buffer);
        if (!pdfText || pdfText.trim().length < 50) {
          throw new Error(
            '이 PDF에서는 텍스트를 추출할 수 없었어요. 스캔본일 가능성이 있어요.',
          );
        }

        // ── 3단계: AI 분석 ──
        setPhase('analyzing');
        const res = await fetch('/api/curriculum/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolName: schoolName.trim(), pdfText }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`AI 분석 실패 (${res.status}) ${errText.slice(0, 120)}`);
        }
        const data = (await res.json()) as {
          subjects?: UploadedCurriculumSubject[];
          _meta?: {
            source: 'hakjum-ai-pdf-extract';
            syncedAt: string;
            model?: string;
          };
        };
        const extracted = Array.isArray(data.subjects) ? data.subjects : [];

        if (extracted.length === 0) {
          throw new Error(
            'AI가 과목을 찾지 못했어요. PDF가 교육과정 운영계획서가 맞는지 확인해주세요.',
          );
        }

        const newMeta: UploadedCurriculum['meta'] = {
          source: 'hakjum-ai-pdf-extract',
          syncedAt: data._meta?.syncedAt ?? new Date().toISOString(),
          model: data._meta?.model,
        };

        // sessionStorage에 저장 → 추천/필수과목 화면에서 우선 사용
        saveUploadedCurriculum({
          schoolName: schoolName.trim(),
          subjects: extracted,
          meta: newMeta,
        });

        setSubjects(extracted);
        setMeta(newMeta);
        setPhase('done');
      } catch (e) {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류가 발생했어요.';
        setErrorMsg(msg);
        setPhase('error');
      }
    },
    [schoolName],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = ''; // 같은 파일 재선택 가능하도록 초기화
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  const reset = () => {
    setPhase('idle');
    setErrorMsg('');
    setSubjects([]);
    setMeta(null);
    setFileName('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* 상단 바 */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 520,
            margin: '0 auto',
            padding: '0 16px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Link
            to="/flow"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: C.bg,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.ink,
              textDecoration: 'none',
            }}
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </Link>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
            교육과정 PDF 업로드
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 6px',
              color: C.ink,
              lineHeight: 1.3,
            }}
          >
            학교에서 받은
            <br />
            교육과정 PDF가 있나요?
          </h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, letterSpacing: '-0.01em' }}>
            AI가 PDF를 읽고 우리 학교의 정확한 개설 과목을 자동으로 정리해드려요.
          </p>
        </div>

        {/* 학교 이름 입력 */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: '-0.02em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            학교 이름
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="예: 한국디지털미디어고등학교"
            disabled={phase !== 'idle' && phase !== 'error' && phase !== 'done'}
            style={{
              width: '100%',
              padding: 14,
              fontSize: 14,
              color: C.ink,
              background: C.bg,
              border: 'none',
              borderRadius: 12,
              outline: 'none',
              letterSpacing: '-0.01em',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 업로드 카드 */}
        {phase === 'idle' || phase === 'error' ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            style={{
              border: `1.5px dashed ${C.line}`,
              borderRadius: 16,
              background: C.bg,
              padding: '28px 18px',
              textAlign: 'center',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: C.brandSoft,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Upload size={22} color={C.brand} strokeWidth={2} />
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: C.ink,
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              교육과정 운영계획서 PDF를 올려주세요
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 14 }}>
              PDF 파일만 가능 · 텍스트가 들어있는 PDF만 분석돼요
            </div>
            <button
              type="button"
              onClick={handlePickFile}
              disabled={!canSubmit}
              className="cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                padding: '12px 22px',
                background: C.brand,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                letterSpacing: '-0.02em',
                boxShadow: `0 4px 14px ${C.brandShadow}`,
                opacity: canSubmit ? 1 : 0.45,
              }}
            >
              <FileText size={16} />
              PDF 선택하기
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
            {errorMsg && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  color: '#b91c1c',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  textAlign: 'left',
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* 진행 상태 */}
        {(phase === 'reading' || phase === 'extracting' || phase === 'analyzing') && (
          <ProgressCard phase={phase} fileName={fileName} />
        )}

        {/* 결과 */}
        {phase === 'done' && (
          <ResultSection
            subjects={subjects}
            meta={meta}
            schoolName={schoolName}
            onReset={reset}
            onProceed={() => navigate('/flow')}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 진행 상태 카드
// ─────────────────────────────────────────────
function ProgressCard({ phase, fileName }: { phase: Phase; fileName: string }) {
  const steps: { key: Phase; label: string }[] = [
    { key: 'reading', label: 'PDF 파일 읽는 중...' },
    { key: 'extracting', label: '텍스트 추출 중...' },
    { key: 'analyzing', label: 'AI가 과목을 분석 중...' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === phase);

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: C.sub,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <FileText size={13} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((s, i) => {
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  background: isDone ? '#eef9f0' : isActive ? C.brandSoft : C.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={14} color="#1c7a3e" strokeWidth={2.4} />
                ) : isActive ? (
                  <Loader2 size={14} className="animate-spin" color={C.brand} />
                ) : (
                  <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>{i + 1}</span>
                )}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? C.ink : isDone ? C.sub : C.sub,
                  letterSpacing: '-0.02em',
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 결과 섹션
// ─────────────────────────────────────────────
function ResultSection({
  subjects,
  meta,
  schoolName,
  onReset,
  onProceed,
}: {
  subjects: UploadedCurriculumSubject[];
  meta: UploadedCurriculum['meta'] | null;
  schoolName: string;
  onReset: () => void;
  onProceed: () => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, UploadedCurriculumSubject[]>();
    for (const s of subjects) {
      const key = s.area || '기타';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [subjects]);

  const openCount = subjects.filter((s) => s.status === '개설').length;
  const closedCount = subjects.length - openCount;
  const dateLabel = meta?.syncedAt ? new Date(meta.syncedAt).toLocaleDateString('ko-KR') : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 요약 카드 */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.brand} 0%, #2f74e6 100%)`,
          color: '#fff',
          borderRadius: 16,
          padding: 18,
          boxShadow: `0 8px 24px ${C.brandShadow}`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            opacity: 0.85,
            letterSpacing: '0.04em',
            marginBottom: 6,
          }}
        >
          AI 추출 완료 · {dateLabel}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.35,
            marginBottom: 12,
          }}
        >
          {schoolName}의 과목 {subjects.length}개를 정리했어요
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SummaryChip label="개설" value={openCount} />
          {closedCount > 0 && <SummaryChip label="미개설" value={closedCount} muted />}
        </div>
      </div>

      {/* 과목 리스트 (영역별 그룹) */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: C.sub,
            marginBottom: 12,
            letterSpacing: '-0.01em',
          }}
        >
          출처: 학생 업로드 PDF (AI 추출{dateLabel ? `, ${dateLabel}` : ''})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {grouped.map(([area, list]) => (
            <div key={area}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: C.brand,
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {area}
                </span>
                <span style={{ fontSize: 11, color: C.sub }}>({list.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {list.map((s, i) => (
                  <span
                    key={`${area}-${i}-${s.name}`}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 600,
                      background: s.status === '미개설' ? '#fff' : C.brandSoft,
                      color: s.status === '미개설' ? C.sub : C.brand,
                      border:
                        s.status === '미개설'
                          ? `1px dashed ${C.line}`
                          : '1px solid transparent',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {s.name}
                    {s.grade ? ` · ${s.grade}학년` : ''}
                    {s.semester ? `${s.semester}학기` : ''}
                    {s.status === '미개설' ? ' (미개설)' : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onProceed}
        className="cursor-pointer active:scale-[0.98] transition-transform"
        style={{
          width: '100%',
          padding: 16,
          background: C.brand,
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          letterSpacing: '-0.02em',
          boxShadow: `0 6px 20px ${C.brandShadow}`,
        }}
      >
        <Sparkles size={16} strokeWidth={2.2} />
        이 데이터로 학과 추천 다시 받기
        <ArrowRight size={16} />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="cursor-pointer"
        style={{
          padding: 12,
          background: 'transparent',
          color: C.sub,
          border: 'none',
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        다른 PDF 다시 업로드
      </button>
    </div>
  );
}

function SummaryChip({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        background: muted ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.22)',
        padding: '6px 12px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}
    >
      <span style={{ opacity: 0.85, marginRight: 6 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// PDF 텍스트 추출 (브라우저, pdfjs-dist 3.x)
// ─────────────────────────────────────────────
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  // pdfjs-dist 3.11.x — 패키지 루트가 main: build/pdf.js 를 가리킴
  const pdfjsLib = await import('pdfjs-dist');
  // Vite ?url import 로 워커 파일을 정적 자산으로 번들링하여 로드
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.js?url')).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: unknown) =>
        typeof item === 'object' && item !== null && 'str' in item
          ? String((item as { str: string }).str)
          : '',
      )
      .join(' ');
    pages.push(text);
  }
  return pages.join('\n\n--- PAGE BREAK ---\n\n');
}
