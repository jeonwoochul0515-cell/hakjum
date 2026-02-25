import { Clock, X, Star, Search } from 'lucide-react';
import { useState } from 'react';
import { getSearchHistory, removeSearchHistory, getFavorites, type SearchHistoryItem, type FavoriteItem } from '@/lib/history';

interface Props {
  onSelectInterest: (interest: string) => void;
  onSelectMajor: (majorName: string, category: string) => void;
}

export function RecentSearches({ onSelectInterest, onSelectMajor }: Props) {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => getSearchHistory());
  const favorites = getFavorites();

  if (history.length === 0 && favorites.length === 0) return null;

  const handleRemove = (interest: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSearchHistory(interest);
    setHistory(getSearchHistory());
  };

  return (
    <div className="mt-4 space-y-4 animate-fade-in-up">
      {/* 즐겨찾기 학과 */}
      {favorites.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold text-slate-600">즐겨찾기 학과</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {favorites.slice(0, 8).map((f: FavoriteItem) => (
              <button
                key={f.majorName}
                onClick={() => onSelectMajor(f.majorName, f.category)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Star size={10} className="fill-amber-400 text-amber-400" />
                {f.majorName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 최근 검색 */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">최근 검색</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.slice(0, 8).map((h: SearchHistoryItem) => (
              <button
                key={h.interest}
                onClick={() => onSelectInterest(h.interest)}
                className="group inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Search size={10} className="text-slate-400" />
                {h.interest}
                <span
                  onClick={(e) => handleRemove(h.interest, e)}
                  className="ml-0.5 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={10} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
