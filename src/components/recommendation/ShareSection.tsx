import { useState, useRef } from 'react';
import { Link2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ShareSectionProps {
  schoolName: string;
  grade: string;
  tags: string[];
  majorName?: string;
  matchRate: number;
  topSubjects: string[];
}

export function ShareSection({ schoolName, grade, tags, majorName, matchRate, topSubjects }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `학점나비_${schoolName}_추천결과.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert('이미지 저장에 실패했어요. 스크린샷으로 저장해주세요!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Shareable card preview */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-5 border border-sky-200"
      >
        <div className="flex items-center gap-2 mb-3">
          <img src="/butterfly.svg" alt="학점나비" className="w-6 h-6" />
          <span className="text-sm font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
            학점나비 추천 결과
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-700">
            <span className="font-bold">{schoolName}</span> · {grade}
          </p>
          {majorName && <p className="text-sm text-indigo-600 font-medium">{majorName}</p>}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-white/80 rounded-full text-slate-600">{tag}</span>
              ))}
            </div>
          )}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-sky-primary">{matchRate}%</span>
            <span className="text-sm text-slate-500">매칭률</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {topSubjects.slice(0, 5).map(s => (
              <span key={s} className="px-2 py-1 text-xs bg-white rounded-lg text-slate-700 font-medium border border-slate-200">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          onClick={handleSaveImage}
        >
          <Download size={16} className="mr-1.5" />
          이미지 저장
        </Button>
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          onClick={handleCopyLink}
        >
          <Link2 size={16} className="mr-1.5" />
          {copied ? '복사됨!' : '링크 복사'}
        </Button>
      </div>
    </div>
  );
}
