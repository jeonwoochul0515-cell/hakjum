import { useState, useCallback } from 'react';
import { REGION_CODES } from '@/lib/neis-api';

const STORAGE_KEY = 'hakjum_selected_region';

export function useRegion() {
  const [selectedRegion, setSelectedRegionState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const setRegion = useCallback((regionCode: string) => {
    setSelectedRegionState(regionCode);
    try {
      localStorage.setItem(STORAGE_KEY, regionCode);
    } catch { /* ignore */ }
  }, []);

  const regionName = selectedRegion
    ? REGION_CODES.find((r) => r.code === selectedRegion)?.name || ''
    : '전체';

  return {
    selectedRegion,
    setRegion,
    regionName,
    allRegions: REGION_CODES,
  };
}
