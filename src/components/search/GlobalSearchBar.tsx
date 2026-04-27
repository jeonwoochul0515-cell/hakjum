import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { C } from '@/lib/design-tokens';
import {
  SearchAutocomplete,
  type MajorItem,
  type UniversityItem,
} from './SearchAutocomplete';

type FlatItem =
  | { kind: 'major'; value: MajorItem }
  | { kind: 'university'; value: UniversityItem };

interface Props {
  variant?: 'header' | 'hero';
  className?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
}

export function GlobalSearchBar({
  variant = 'header',
  className,
  autoFocus = false,
  onSearch,
}: Props) {
  const navigate = useNavigate();
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [items, setItems] = useState<FlatItem[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* ---------- autoFocus ---------- */
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  /* ---------- debounce 250ms ---------- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rawQuery]);

  /* ---------- outside click ---------- */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  /* ---------- selection handlers ---------- */
  const handleSelectMajor = useCallback(
    (m: MajorItem) => {
      sessionStorage.setItem('hakjum-entry', 'global-search');
      sessionStorage.setItem(
        'hakjum-search-major',
        JSON.stringify({ majorName: m.majorName, category: m.category }),
      );
      setIsOpen(false);
      setActiveIndex(-1);
      onSearch?.(m.majorName);
      navigate(
        `/flow?major=${encodeURIComponent(m.majorName)}&category=${encodeURIComponent(m.category)}`,
      );
    },
    [navigate, onSearch],
  );

  const handleSelectUniversity = useCallback(
    (u: UniversityItem) => {
      sessionStorage.setItem('hakjum-entry', 'global-search');
      sessionStorage.setItem(
        'hakjum-search-university',
        JSON.stringify({ name: u.name, region: u.region }),
      );
      setIsOpen(false);
      setActiveIndex(-1);
      onSearch?.(u.name);
      navigate(`/flow?university=${encodeURIComponent(u.name)}`);
    },
    [navigate, onSearch],
  );

  /* ---------- keyboard ---------- */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % items.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
      return;
    }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < items.length) {
        e.preventDefault();
        const item = items[activeIndex];
        if (item.kind === 'major') handleSelectMajor(item.value);
        else handleSelectUniversity(item.value);
      } else if (rawQuery.trim()) {
        // Plain submit: notify and close
        onSearch?.(rawQuery.trim());
        setIsOpen(false);
      }
    }
  };

  /* ---------- sizing per variant ---------- */
  const isHero = variant === 'hero';
  const inputHeight = isHero ? 56 : 44;
  const fontSize = isHero ? 16 : 14;
  const iconSize = isHero ? 20 : 17;
  const paddingX = isHero ? 18 : 14;

  /* ---------- styles ---------- */
  const borderColor = focused ? C.brand : C.line;
  const boxShadow = focused ? `0 0 0 4px ${C.brandShadow}` : 'none';

  return (
    <div
      ref={wrapperRef}
      className={className}
      data-hakjum-search={variant}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: isHero ? 560 : '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: inputHeight,
          background: '#fff',
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          padding: `0 ${paddingX}px`,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow,
        }}
      >
        <Search size={iconSize} strokeWidth={2.2} color={focused ? C.brand : C.sub} />
        <input
          ref={inputRef}
          type="text"
          value={rawQuery}
          onChange={(e) => {
            setRawQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={isHero ? '학과나 대학을 검색해보세요' : '학과 · 대학 검색'}
          aria-label="학과 및 대학 통합 검색"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize,
            background: 'transparent',
            color: C.ink,
            letterSpacing: '-0.02em',
            minWidth: 0,
          }}
        />
        {rawQuery && (
          <button
            type="button"
            onClick={() => {
              setRawQuery('');
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label="검색어 지우기"
            style={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: C.sub,
              padding: 0,
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <SearchAutocomplete
        query={debouncedQuery}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setActiveIndex(-1);
        }}
        onSelectMajor={handleSelectMajor}
        onSelectUniversity={handleSelectUniversity}
        activeIndex={activeIndex}
        onItemsChange={setItems}
      />

      {/* mobile responsiveness — hero variant shrinks padding/height under 640px */}
      <style>{`
        @media (max-width: 640px) {
          [data-hakjum-search="hero"] input { font-size: 15px; }
          [data-hakjum-search="hero"] { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

export default GlobalSearchBar;
