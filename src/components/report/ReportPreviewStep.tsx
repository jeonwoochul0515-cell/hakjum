import { useRef, lazy, Suspense, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Calendar, Lock, Download, Share2,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useReportContext } from '@/context/ReportContext';

// ── 확정된 섹션 컴포넌트 ──
import { ProfileSection } from '@/components/report/sections/ProfileSection';
import { MajorTop10Section } from '@/components/report/sections/MajorTop10Section';

// ── 다른 에이전트가 구현 중인 섹션 (lazy + 에러 경계) ──
function safeLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | { [key: string]: T }>
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // named export 또는 default export 모두 처리
      if ('default' in mod) return mod as { default: T };
      const first = Object.values(mod)[0] as T;
      return { default: first };
    } catch {
      return { default: (() => null) as unknown as T };
    }
  });
}

const MajorDetailSectionLazy = safeLazy(() => import('@/components/report/sections/MajorDetailSection'));
const UnivMatchSectionLazy = safeLazy(() => import('@/components/report/sections/UniversityMatchSection'));
const AdmissionStrategySectionLazy = safeLazy(() => import('@/components/report/sections/AdmissionStrategySection'));
const FulfillmentSectionLazy = safeLazy(() => import('@/components/report/sections/FulfillmentSection'));
const SubjectTieringSectionLazy = safeLazy(() => import('@/components/report/sections/SubjectTieringSection'));
const RoadmapSectionLazy = safeLazy(() => import('@/components/report/sections/RoadmapSection'));
const CompetitionSectionLazy = safeLazy(() => import('@/components/report/sections/CompetitionSection'));
const ActionPlanSectionLazy = safeLazy(() => import('@/components/report/sections/ActionPlanSection'));

interface Props {
  isPaid?: boolean;
}

const SECTION_META = [
  { id: 'profile', label: '1. 프로필 요약', free: true },
  { id: 'majorTop10', label: '2. 추천 학과 TOP 10', free: true },
  { id: 'majorDetail', label: '3. 학과 상세 분석', free: false },
  { id: 'universityMatch', label: '4. 대학 매칭', free: false },
  { id: 'admissionStrategy', label: '5. 입시 전략', free: false },
  { id: 'fulfillmentRate', label: '6. 교과이수 충족률', free: true },
  { id: 'subjectTiering', label: '7. 과목 우선순위', free: false },
  { id: 'roadmap', label: '8. 3개년 로드맵', free: false },
  { id: 'competition', label: '9. 경쟁률 분석', free: false },
  { id: 'actionPlan', label: '10. 액션 플랜', free: false },
] as const;

export function ReportPreviewStep({ isPaid = false }: Props) {
  const { state } = useReportContext();
  const navigate = useNavigate();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reportData = state.reportData;

  if (!reportData) return null;

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePayment = () => {
    sessionStorage.setItem('pendingReport', JSON.stringify(reportData));
    navigate('/subscription');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI 입시 분석 보고서 - 학점나비',
          text: `${reportData.input.school.name} 맞춤 입시 분석 보고서`,
          url: window.location.href,
        });
      } catch {
        // 사용자가 공유 취소
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    }
  };

  const createdAt = new Date(reportData.createdAt);
  const formattedDate = `${createdAt.getFullYear()}년 ${createdAt.getMonth() + 1}월 ${createdAt.getDate()}일`;

  return (
    <div className="space-y-4 animate-fade-in-up pb-24">
      {/* ── 상단 헤더 ── */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} />
          <h1 className="text-lg font-bold">AI 분석 보고서</h1>
        </div>
        <p className="text-sm text-sky-100 flex items-center gap-1.5">
          <Calendar size={14} />
          {formattedDate} 생성
        </p>
        <p className="text-sm text-sky-100 mt-1">
          {reportData.input.school.name} · {reportData.input.grade} · {reportData.input.interest || reportData.input.tags.join(', ')}
        </p>
      </div>

      {/* ── 목차 ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold text-slate-700 mb-3">목차</h2>
        <div className="space-y-1">
          {SECTION_META.map((section) => {
            const isLocked = !isPaid && !section.free;
            return (
              <button
                key={section.id}
                onClick={() => !isLocked && scrollToSection(section.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  isLocked
                    ? 'text-slate-400 bg-slate-50'
                    : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isLocked && <Lock size={12} className="text-slate-400" />}
                  {section.label}
                </span>
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 섹션 렌더링 ── */}

      {/* 1. 프로필 */}
      {reportData.sections.profile && (
        <div ref={(el) => { sectionRefs.current['profile'] = el; }}>
          <ProfileSection data={reportData.sections.profile} />
        </div>
      )}

      {/* 2. 추천 학과 TOP 10 */}
      {reportData.sections.majorTop10 && (
        <div ref={(el) => { sectionRefs.current['majorTop10'] = el; }}>
          <MajorTop10Section data={reportData.sections.majorTop10} isPaid={isPaid} />
        </div>
      )}

      {/* ── 무료 사용자 결제 유도 (섹션 3 전) ── */}
      {!isPaid && <PaymentCTA onPayment={handlePayment} />}

      {/* 3. 학과 상세 */}
      {reportData.sections.majorDetail && (
        <div ref={(el) => { sectionRefs.current['majorDetail'] = el; }}>
          {isPaid ? (
            <Suspense fallback={<PlaceholderSection label="학과 상세 분석" />}>
              <MajorDetailSectionLazy data={reportData.sections.majorDetail} isPaid={isPaid} />
            </Suspense>
          ) : (
            <LockedSection label="학과 상세 분석" />
          )}
        </div>
      )}

      {/* 4. 대학 매칭 */}
      {reportData.sections.universityMatch && (
        <div ref={(el) => { sectionRefs.current['universityMatch'] = el; }}>
          {isPaid ? (
            <Suspense fallback={<PlaceholderSection label="대학 매칭" />}>
              <UnivMatchSectionLazy data={reportData.sections.universityMatch} isPaid={isPaid} />
            </Suspense>
          ) : (
            <LockedSection label="대학 매칭" />
          )}
        </div>
      )}

      {/* 5. 입시 전략 */}
      {reportData.sections.admissionStrategy && (
        <div ref={(el) => { sectionRefs.current['admissionStrategy'] = el; }}>
          {isPaid ? (
            <Suspense fallback={<PlaceholderSection label="입시 전략" />}>
              <AdmissionStrategySectionLazy data={reportData.sections.admissionStrategy} isPaid={isPaid} />
            </Suspense>
          ) : (
            <LockedSection label="입시 전략" />
          )}
        </div>
      )}

      {/* 6. 교과이수 충족률 (무료) */}
      {reportData.sections.fulfillmentRate && (
        <div ref={(el) => { sectionRefs.current['fulfillmentRate'] = el; }}>
          <Suspense fallback={<PlaceholderSection label="교과이수 충족률" />}>
            <FulfillmentSectionLazy data={reportData.sections.fulfillmentRate} isPaid={isPaid} />
          </Suspense>
        </div>
      )}

      {/* ── 중간 결제 유도 ── */}
      {!isPaid && <PaymentCTA onPayment={handlePayment} variant="compact" />}

      {/* 7. 과목 우선순위 */}
      {reportData.sections.subjectTiering && (
        <div ref={(el) => { sectionRefs.current['subjectTiering'] = el; }}>
          {isPaid ? (
            <Suspense fallback={<PlaceholderSection label="과목 우선순위" />}>
              <SubjectTieringSectionLazy data={reportData.sections.subjectTiering} isPaid={isPaid} />
            </Suspense>
          ) : (
            <LockedSection label="과목 우선순위" />
          )}
        </div>
      )}

      {/* 8. 3개년 로드맵 */}
      {reportData.sections.roadmap && (
        <div ref={(el) => { sectionRefs.current['roadmap'] = el; }}>
          {isPaid ? (
            <Suspense fallback={<PlaceholderSection label="3개년 로드맵" />}>
              <RoadmapSectionLazy data={reportData.sections.roadmap} isPaid={isPaid} />
            </Suspense>
          ) : (
            <LockedSection label="3개년 로드맵" />
          )}
        </div>
      )}

      {/* 9. 경쟁률 분석 */}
      {reportData.sections.competition && (
        <div ref={(el) => { sectionRefs.current['competition'] = el; }}>
          {isPaid ? (
            <Suspense fallback={<PlaceholderSection label="경쟁률 분석" />}>
              <CompetitionSectionLazy data={reportData.sections.competition} isPaid={isPaid} />
            </Suspense>
          ) : (
            <LockedSection label="경쟁률 분석" />
          )}
        </div>
      )}

      {/* 10. 액션 플랜 */}
      {reportData.sections.actionPlan && (
        <div ref={(el) => { sectionRefs.current['actionPlan'] = el; }}>
          {isPaid ? (
            <Suspense fallback={<PlaceholderSection label="액션 플랜" />}>
              <ActionPlanSectionLazy data={reportData.sections.actionPlan} isPaid={isPaid} />
            </Suspense>
          ) : (
            <LockedSection label="액션 플랜" />
          )}
        </div>
      )}

      {/* ── 하단 고정 바 ── */}
      {isPaid ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex gap-2">
            <Button variant="primary" size="md" className="flex-1" onClick={() => window.print()}>
              <Download size={16} className="mr-2" />
              PDF 다운로드
            </Button>
            <Button variant="secondary" size="md" className="flex-1" onClick={handleShare}>
              <Share2 size={16} className="mr-2" />
              공유하기
            </Button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3">
            <button
              onClick={handlePayment}
              className="w-full py-3 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              전체 보고서 잠금해제 - 4,900원
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 결제 유도 배너 ──
function PaymentCTA({ onPayment, variant = 'full' }: { onPayment: () => void; variant?: 'full' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-amber-800">나머지 섹션도 확인하세요</p>
            <p className="text-xs text-amber-600 mt-0.5">잠긴 7개 섹션 잠금해제</p>
          </div>
          <button
            onClick={onPayment}
            className="px-4 py-2 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            4,900원
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 rounded-2xl p-5 border border-sky-200 shadow-sm">
      <div className="text-center">
        <Lock size={24} className="mx-auto text-sky-primary mb-2" />
        <h3 className="text-base font-bold text-slate-800">전체 보고서 잠금해제</h3>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          학과 상세 분석, 대학 매칭, 입시 전략, 3개년 로드맵 등<br />
          <strong className="text-slate-700">8개 심화 섹션</strong>을 확인하세요
        </p>

        <div className="flex items-center justify-center gap-2 mt-3 mb-4">
          <span className="text-sm text-slate-400 line-through">입시 컨설팅 50~300만원</span>
          <ArrowRight size={14} className="text-slate-300" />
          <span className="text-lg font-bold text-sky-primary">4,900원</span>
        </div>

        <button
          onClick={onPayment}
          className="w-full py-3 bg-gradient-to-r from-sky-primary to-indigo-primary text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
        >
          전체 보고서 잠금해제 -- 4,900원
        </button>
        <p className="text-[11px] text-slate-400 mt-2">7일 이내 미열람 시 전액 환불</p>
      </div>
    </div>
  );
}

// ── 잠긴 섹션 (블러) ──
function LockedSection({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <Lock size={16} />
          <span className="text-sm font-medium">유료 전용 섹션</span>
        </div>
      </div>
      <h3 className="text-sm font-bold text-slate-300 mb-2">{label}</h3>
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="h-4 bg-slate-100 rounded w-5/6" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
      </div>
    </div>
  );
}

// ── 데이터는 있으나 컴포넌트 로딩 중 ──
function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-2">{label}</h3>
      <p className="text-xs text-slate-400">섹션 컴포넌트 로딩 중...</p>
    </div>
  );
}
