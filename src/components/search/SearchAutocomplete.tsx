import { useEffect, useRef, useState, useCallback } from 'react';
import { BookOpen, Building, ArrowRight, Loader2 } from 'lucide-react';
import { C } from '@/lib/design-tokens';

export interface MajorItem {
  majorName: string;
  category: string;
}

export interface UniversityItem {
  name: string;
  region: string;
}

interface ApiResponse<T> {
  data: T[];
  _meta?: Record<string, unknown>;
}

interface Props {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectMajor: (major: MajorItem) => void;
  onSelectUniversity: (uni: UniversityItem) => void;
  /** Active index from parent's keyboard nav, -1 if none */
  activeIndex?: number;
  /** Notify parent of total selectable item count for keyboard nav */
  onItemsChange?: (items: Array<
    | { kind: 'major'; value: MajorItem }
    | { kind: 'university'; value: UniversityItem }
  >) => void;
}

/* ---------- mock fallback ---------- */
const MOCK_MAJORS: MajorItem[] = [
  { majorName: '컴퓨터공학과', category: '공학계열' },
  { majorName: '의예과', category: '의약계열' },
  { majorName: '경영학과', category: '사회계열' },
  { majorName: '간호학과', category: '의약계열' },
  { majorName: '심리학과', category: '사회계열' },
];

const MOCK_UNIVERSITIES: UniversityItem[] = [
  { name: '서울대학교', region: '서울' },
  { name: '연세대학교', region: '서울' },
  { name: '고려대학교', region: '서울' },
  { name: '카이스트', region: '대전' },
  { name: '포항공과대학교', region: '경북' },
];

const POPULAR_TERMS = ['컴퓨터공학과', '의예과', '경영학과', '서울대학교', '연세대학교'];

function filterMock<T>(list: T[], q: string, key: (t: T) => string): T[] {
  if (!q) return list.slice(0, 5);
  const lower = q.toLowerCase();
  return list.filter((it) => key(it).toLowerCase().includes(lower)).slice(0, 5);
}

async function fetchMajors(q: string): Promise<MajorItem[]> {
  try {
    const res = await fetch(`/api/search/major?q=${encodeURIComponent(q)}&limit=5`);
    if (!res.ok) throw new Error('major fetch failed');
    const json: ApiResponse<MajorItem> = await res.json();
    if (!json?.data || json.data.length === 0) {
      return filterMock(MOCK_MAJORS, q, (m) => m.majorName);
    }
    return json.data;
  } catch {
    return filterMock(MOCK_MAJORS, q, (m) => m.majorName);
  }
}

async function fetchUniversities(q: string): Promise<UniversityItem[]> {
  try {
    const res = await fetch(`/api/search/university?q=${encodeURIComponent(q)}&limit=5`);
    if (!res.ok) throw new Error('university fetch failed');
    const json: ApiResponse<UniversityItem> = await res.json();
    if (!json?.data || json.data.length === 0) {
      return filterMock(MOCK_UNIVERSITIES, q, (u) => u.name);
    }
    return json.data;
  } catch {
    return filterMock(MOCK_UNIVERSITIES, q, (u) => u.name);
  }
}

export function SearchAutocomplete({
  query,
  isOpen,
  onClose: _onClose,
  onSelectMajor,
  onSelectUniversity,
  activeIndex = -1,
  onItemsChange,
}: Props) {
  // _onClose intentionally unused inside dropdown body (parent controls close on outside click / escape)
  void _onClose;

  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);

  // Notify parent of flat item list whenever results change so keyboard nav stays in sync
  const emitItems = useCallback(
    (mj: MajorItem[], un: UniversityItem[]) => {
      if (!onItemsChange) return;
      const flat: Array<
        | { kind: 'major'; value: MajorItem }
        | { kind: 'university'; value: UniversityItem }
      > = [
        ...mj.map((m) => ({ kind: 'major' as const, value: m })),
        ...un.map((u) => ({ kind: 'university' as const, value: u })),
      ];
      onItemsChange(flat);
    },
    [onItemsChange],
  );

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setMajors([]);
      setUniversities([]);
      setLoading(false);
      emitItems([], []);
      return;
    }

    const myReqId = ++reqIdRef.current;
    setLoading(true);

    Promise.all([fetchMajors(trimmed), fetchUniversities(trimmed)])
      .then(([mj, un]) => {
        if (cancelled || reqIdRef.current !== myReqId) return;
        setMajors(mj);
        setUniversities(un);
        emitItems(mj, un);
      })
      .finally(() => {
        if (cancelled || reqIdRef.current !== myReqId) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, emitItems]);

  if (!isOpen) return null;

  const trimmed = query.trim();
  const isEmpty = trimmed.length < 2;
  const hasResults = majors.length > 0 || universities.length > 0;

  // Index map: majors first, then universities
  let runningIdx = -1;
  const indexFor = () => ++runningIdx;

  return (
    <div
      role="listbox"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        right: 0,
        background: '#fff',
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.10)',
        overflow: 'hidden',
        zIndex: 50,
        maxHeight: 420,
        overflowY: 'auto',
      }}
    >
      {/* Empty / popular state */}
      {isEmpty && (
        <div style={{ padding: '14px 16px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.sub,
              letterSpacing: '-0.01em',
              marginBottom: 8,
            }}
          >
            인기 검색어
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {POPULAR_TERMS.map((term) => (
              <span
                key={term}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: C.bg,
                  color: C.ink,
                  border: `1px solid ${C.line}`,
                  borderRadius: 999,
                  letterSpacing: '-0.01em',
                }}
              >
                {term}
              </span>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: C.sub,
              letterSpacing: '-0.01em',
            }}
          >
            2자 이상 입력하면 학과 · 대학을 함께 검색합니다
          </div>
        </div>
      )}

      {/* Loading */}
      {!isEmpty && loading && (
        <div
          style={{
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: C.sub,
            fontSize: 13,
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          검색 중...
        </div>
      )}

      {/* No results */}
      {!isEmpty && !loading && !hasResults && (
        <div
          style={{
            padding: '20px 16px',
            color: C.sub,
            fontSize: 13,
            letterSpacing: '-0.01em',
          }}
        >
          "{trimmed}"에 대한 검색 결과가 없습니다
        </div>
      )}

      {/* Major group */}
      {!isEmpty && !loading && majors.length > 0 && (
        <div>
          <div
            style={{
              padding: '10px 16px 6px',
              fontSize: 11,
              fontWeight: 700,
              color: C.sub,
              letterSpacing: '-0.01em',
              background: '#fafbfc',
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            학과
          </div>
          {majors.map((m) => {
            const idx = indexFor();
            const active = idx === activeIndex;
            return (
              <button
                key={`major-${m.majorName}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectMajor(m);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  background: active ? C.brandSoft : '#fff',
                  border: 'none',
                  borderBottom: `1px solid ${C.line}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  letterSpacing: '-0.02em',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = C.brandSoft;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = active ? C.brandSoft : '#fff';
                }}
              >
                <BookOpen size={15} strokeWidth={2.2} color={active ? C.brand : C.sub} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? C.brand : C.ink,
                    flex: 1,
                  }}
                >
                  {m.majorName}
                </span>
                <span style={{ fontSize: 11, color: C.sub }}>{m.category}</span>
                <ArrowRight size={13} color={active ? C.brand : C.sub} />
              </button>
            );
          })}
        </div>
      )}

      {/* University group */}
      {!isEmpty && !loading && universities.length > 0 && (
        <div>
          <div
            style={{
              padding: '10px 16px 6px',
              fontSize: 11,
              fontWeight: 700,
              color: C.sub,
              letterSpacing: '-0.01em',
              background: '#fafbfc',
              borderTop: `1px solid ${C.line}`,
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            대학
          </div>
          {universities.map((u) => {
            const idx = indexFor();
            const active = idx === activeIndex;
            return (
              <button
                key={`uni-${u.name}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectUniversity(u);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  background: active ? C.brandSoft : '#fff',
                  border: 'none',
                  borderBottom: `1px solid ${C.line}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  letterSpacing: '-0.02em',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = C.brandSoft;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = active ? C.brandSoft : '#fff';
                }}
              >
                <Building size={15} strokeWidth={2.2} color={active ? C.brand : C.sub} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? C.brand : C.ink,
                    flex: 1,
                  }}
                >
                  {u.name}
                </span>
                <span style={{ fontSize: 11, color: C.sub }}>{u.region}</span>
                <ArrowRight size={13} color={active ? C.brand : C.sub} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchAutocomplete;
