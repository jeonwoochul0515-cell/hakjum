import { Share2, Check, Copy } from 'lucide-react';
import { useState, useCallback } from 'react';

interface Props {
  interest: string;
  majorName?: string;
}

export function ShareButton({ interest, majorName }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('q', interest);
    if (majorName) params.set('major', majorName);
    const url = `${window.location.origin}/explore?${params}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: majorName
            ? `학점나비 - ${majorName}`
            : `학점나비 - "${interest}" 추천 결과`,
          text: majorName
            ? `${majorName} 학과 정보를 확인해보세요!`
            : `"${interest}" 관련 학과 추천 결과를 확인해보세요!`,
          url,
        });
        return;
      } catch {
        // 사용자 취소 시 clipboard로 fallback
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 실패 시 무시
    }
  }, [interest, majorName]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
    >
      {copied ? (
        <>
          <Check size={14} className="text-green-500" />
          <span className="text-green-600">복사됨</span>
        </>
      ) : (
        <>
          {'share' in navigator ? <Share2 size={14} /> : <Copy size={14} />}
          공유
        </>
      )}
    </button>
  );
}
