const HISTORY_KEY = 'hakjum_search_history';
const FAVORITES_KEY = 'hakjum_favorites';
const MAX_HISTORY = 20;

export interface SearchHistoryItem {
  interest: string;
  schoolName?: string;
  timestamp: number;
}

export interface FavoriteItem {
  majorName: string;
  category: string;
  interest: string;
  timestamp: number;
}

function readJSON<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

// 검색 히스토리
export function getSearchHistory(): SearchHistoryItem[] {
  return readJSON<SearchHistoryItem>(HISTORY_KEY);
}

export function addSearchHistory(interest: string, schoolName?: string): void {
  const history = getSearchHistory().filter((h) => h.interest !== interest);
  history.unshift({ interest, schoolName, timestamp: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function removeSearchHistory(interest: string): void {
  const history = getSearchHistory().filter((h) => h.interest !== interest);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// 즐겨찾기
export function getFavorites(): FavoriteItem[] {
  return readJSON<FavoriteItem>(FAVORITES_KEY);
}

export function toggleFavorite(majorName: string, category: string, interest: string): boolean {
  const favorites = getFavorites();
  const idx = favorites.findIndex((f) => f.majorName === majorName);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return false; // removed
  }
  favorites.unshift({ majorName, category, interest, timestamp: Date.now() });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return true; // added
}

export function isFavorite(majorName: string): boolean {
  return getFavorites().some((f) => f.majorName === majorName);
}
