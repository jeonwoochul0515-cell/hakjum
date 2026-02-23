import { Search } from 'lucide-react';

interface SchoolSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
}

export function SchoolSearch({ query, onQueryChange }: SchoolSearchProps) {
  return (
    <div className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="학교 이름으로 검색..."
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-primary/30 focus:border-sky-primary text-sm transition-all"
      />
    </div>
  );
}
