import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartyPopper, Share2, RotateCcw, Sparkles, Lock, Download, Send } from 'lucide-react';
import { SubjectTier } from '@/components/recommendation/SubjectTier';
import { SubjectMatchList } from '@/components/recommendation/SubjectMatchList';
import { AdmissionStrategy } from '@/components/recommendation/AdmissionStrategy';
import { StrategySummary } from '@/components/recommendation/StrategySummary';
import { ShareSection } from '@/components/recommendation/ShareSection';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFlow } from '@/hooks/useFlow';
import { useAuth } from '@/context/AuthContext';
import { generatePdfReport } from '@/lib/pdf-report';

function MatchRateCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) return;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="text-center animate-count-up">
      <div className="text-5xl font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
        {count}%
      </div>
      <p className="text-sm text-slate-500 mt-1">매칭률</p>
    </div>
  );
}

export function SubjectMatchStep() {
  const { state, go } = useFlow();
  const { school, grade, interest, tags, selectedMajor, recommendationResult: result } = state;
  const [showShare, setShowShare] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const navigate = useNavigate();
  const { isPaidUser, profileExtra, decrementReport, currentUser } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const loading = !result;
  const reportsRemaining = profileExtra.purchase?.reportsRemaining ?? 0;

  const matchRate = useMemo(() => {
    if (!result?.subjectMatches || result.subjectMatches.length === 0) {
      if (!result) return 0;
      const essential = result.tiers.find((t) => t.tier === 'essential')?.subjects.length || 0;
      const recommended = result.tiers.find((t) => t.tier === 'strongly_recommended')?.subjects.length || 0;
      return Math.min(90, Math.round((essential + recommended * 0.7) * 10));
    }
    const available = result.subjectMatches.filter((m) => m.status === 'available').length;
    const total = result.subjectMatches.length;
    return total > 0 ? Math.round((available / total) * 100) : 0;
  }, [result]);

  const topSubjects = useMemo(() => {
    if (!result) return [];
    return result.tiers.flatMap((t) => t.subjects).slice(0, 5).map((s) => s.name);
  }, [result]);

  const totalRecommended = useMemo(() => {
    if (!result) return 0;
    return result.tiers.reduce((sum, t) => sum + t.subjects.length, 0);
  }, [result]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-primary to-indigo-primary opacity-15 animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img src="/butterfly.svg" alt="" className="w-12 h-12 animate-butterfly" />
          </div>
        </div>
        <div className="w-48 bg-slate-100 rounded-full h-1.5 mb-8">
          <div className="bg-gradient-to-r from-sky-primary to-indigo-primary h-1.5 rounded-full animate-pulse w-2/3" />
        </div>
        <p className="text-sm font-medium text-slate-700">
          {school?.name || '학교'} 개설과목과 매칭 중...
        </p>
        <div className="mt-8 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 max-w-xs">
          <p className="text-xs text-amber-700 text-center">
            <Sparkles size={12} className="inline mr-1" />
            진로와 연계된 과목 선택은 학생부에서 큰 강점이에요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Result header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-2xl mb-2">
          <PartyPopper size={28} className="text-amber-primary" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">나만을 위한 맞춤 과목 조합이 완성됐어요!</h1>
        <p className="text-sm text-slate-500 mt-2">
          {school?.name || ''} × {tags.length > 0 ? tags[0] : selectedMajor?.name || '선택 진로'} — {school?.allSubjects.length || 0}개 과목 중 {totalRecommended}개를 엄선했어요
        </p>
      </div>

      {/* Match rate */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <MatchRateCounter target={matchRate} />
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {school && <Badge color="sky">{school.name}</Badge>}
          {grade && <Badge color="indigo">{grade}</Badge>}
          {selectedMajor && <Badge color="green">{selectedMajor.name}</Badge>}
          {tags.map((tag) => (
            <Badge key={tag} color="amber">{tag}</Badge>
          ))}
        </div>
        {interest && <p className="text-sm text-slate-500 mt-3 text-center">"{interest}"</p>}
      </div>

      {/* Source badge */}
      <div className="flex justify-center">
        {result.source === 'ai' && <Badge color="indigo">AI 맞춤 추천</Badge>}
        {result.source === 'fallback' && <Badge color="amber">키워드 기반 추천</Badge>}
      </div>

      {/* All tiers — reportRef wraps everything for PDF */}
      <div ref={reportRef}>
        {/* Tier 1 (essential) - always visible */}
        <div className="space-y-3">
          {result.tiers
            .filter((tier) => tier.tier === 'essential')
            .map((tier) => (
              <SubjectTier key={tier.tier} tier={tier} />
            ))}
        </div>

        {/* Tiers 2-4 + analysis - paywall for non-paid users */}
        <div className="relative mt-3">
          <div
            className={!isPaidUser ? 'pointer-events-none select-none' : ''}
            style={!isPaidUser ? { filter: 'blur(6px)' } : undefined}
          >
            <div className="space-y-3">
              {result.tiers
                .filter((tier) => tier.tier !== 'essential')
                .map((tier) => (
                  <SubjectTier key={tier.tier} tier={tier} />
                ))}
            </div>

          {result.subjectMatches && result.subjectMatches.length > 0 && (
            <div className="mt-4">
              <SubjectMatchList matches={result.subjectMatches} />
            </div>
          )}

          {result.admissionInfo && selectedMajor && (
            <div className="mt-4">
              <AdmissionStrategy info={result.admissionInfo} majorName={selectedMajor.name} />
            </div>
          )}

          <div className="mt-4">
            <StrategySummary strategy={result.strategy} source={result.source} />
          </div>
        </div>

        {/* Paywall CTA overlay */}
        {!isPaidUser && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-indigo-100 max-w-sm mx-4 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                전체 분석 리포트 받기 — 4,900원
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                나머지 추천 과목, 입시 전략, 맞춤 분석을 확인하세요
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full mb-2"
                onClick={() => navigate('/subscription')}
              >
                결제하기
              </Button>
              <p className="text-xs text-slate-400">1회 결제 · 자동갱신 없음</p>

              {/* 부모 대리결제 링크 */}
              {currentUser && (
                <button
                  onClick={() => {
                    const payUrl = `${window.location.origin}/pay?uid=${currentUser.uid}&plan=report&name=${encodeURIComponent(currentUser.displayName || '')}`;
                    if (navigator.share) {
                      navigator.share({
                        title: '학점나비 결제 요청',
                        text: `${currentUser.displayName || '자녀'}의 과목 분석 리포트 결제를 요청드립니다.`,
                        url: payUrl,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(payUrl);
                      alert('결제 링크가 복사되었습니다. 부모님께 전달해주세요.');
                    }
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer mx-auto"
                >
                  <Send size={12} />
                  부모님께 결제 요청하기
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      </div>{/* close reportRef */}

      {/* PDF Download for paid users */}
      {isPaidUser && (
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-800">PDF 리포트 다운로드</p>
              <p className="text-xs text-indigo-500 mt-0.5">남은 횟수: {reportsRemaining}건</p>
            </div>
            <Button
              variant="primary"
              size="md"
              disabled={reportsRemaining <= 0 || pdfLoading}
              onClick={async () => {
                if (!reportRef.current || !school || !selectedMajor) return;
                setPdfLoading(true);
                try {
                  await generatePdfReport(reportRef.current, {
                    schoolName: school.name,
                    majorName: selectedMajor.name,
                    date: new Date().toLocaleDateString('ko-KR'),
                  });
                  await decrementReport();
                } catch (err) {
                  console.error('PDF 생성 실패:', err);
                } finally {
                  setPdfLoading(false);
                }
              }}
            >
              {pdfLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  생성 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download size={16} />
                  다운로드
                </span>
              )}
            </Button>
          </div>
          {reportsRemaining <= 0 && (
            <p className="text-xs text-red-500 mt-2">다운로드 횟수를 모두 사용했습니다.</p>
          )}
        </div>
      )}

      {/* Share toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowShare(!showShare)}
          className="flex items-center gap-2 text-sm font-medium text-sky-primary hover:text-sky-600 transition-colors cursor-pointer mx-auto"
        >
          <Share2 size={16} />
          {showShare ? '공유 닫기' : '결과 저장 & 공유하기'}
        </button>
      </div>

      {showShare && school && (
        <div className="animate-fade-in-up">
          <ShareSection
            schoolName={school.name}
            grade={grade}
            tags={tags}
            majorName={selectedMajor?.name}
            matchRate={matchRate}
            topSubjects={topSubjects}
          />
        </div>
      )}

      {/* Bottom CTAs - 하나로 통합 */}
      <div className="space-y-2 pt-2">
        <Button size="lg" className="w-full" onClick={() => go('interest-input')}>
          <RotateCcw size={16} className="mr-2" />
          다른 진로로 다시 탐색하기
        </Button>
      </div>
    </div>
  );
}
