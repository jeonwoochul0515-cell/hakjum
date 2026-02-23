import { useState, useMemo } from 'react';
import { schools, schoolTypes } from '@/data/schools';

export function useSchoolSearch() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('전체');

  const filtered = useMemo(() => {
    let result = schools;

    if (typeFilter !== '전체') {
      result = result.filter((s) => s.type === typeFilter);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    return result;
  }, [query, typeFilter]);

  return {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    filtered,
    types: ['전체', ...schoolTypes],
  };
}
