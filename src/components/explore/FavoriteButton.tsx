import { Star } from 'lucide-react';
import { useState } from 'react';
import { isFavorite, toggleFavorite } from '@/lib/history';

interface Props {
  majorName: string;
  category: string;
  interest: string;
}

export function FavoriteButton({ majorName, category, interest }: Props) {
  const [fav, setFav] = useState(() => isFavorite(majorName));

  const handleToggle = () => {
    const added = toggleFavorite(majorName, category, interest);
    setFav(added);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1 text-sm cursor-pointer transition-colors ${
        fav ? 'text-amber-500' : 'text-slate-400 hover:text-amber-400'
      }`}
      title={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      <Star size={16} className={fav ? 'fill-amber-500' : ''} />
    </button>
  );
}
