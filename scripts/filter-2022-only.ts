/**
 * 학교알리미 sync 결과 정리:
 *   1) 2015 개정 명칭 제거 (32 마커)
 *   2) 메타 노이즈 라벨 제거 ("기타특수", "기타")
 *   3) 전문교과(특성화고) 분리 → 별도 파일
 *
 * 입력: data/schoolinfo/api24-04-2025-d20.json (78,521건)
 * 출력:
 *   - data/schoolinfo/api24-04-2025-d20-2022only.json (일반고 보통교과)
 *   - data/schoolinfo/api24-04-2025-d20-vocational.json (특성화고 전문교과)
 */

import * as fs from 'fs';
import * as path from 'path';

const LEGACY_FILE = path.resolve(process.cwd(), 'src/data/curriculum-2015-legacy.json');
const INPUT_FILE = path.resolve(process.cwd(), 'data/schoolinfo/api24-04-2025-d20.json');
const OUTPUT_GENERAL = path.resolve(
  process.cwd(),
  'data/schoolinfo/api24-04-2025-d20-2022only.json'
);
const OUTPUT_VOCATIONAL = path.resolve(
  process.cwd(),
  'data/schoolinfo/api24-04-2025-d20-vocational.json'
);

interface LegacyConfig {
  definite2015Only: string[];
  renamedIn2022: string[];
  metaNoiseLabels: string[];
}

function main() {
  const legacy = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf-8')) as LegacyConfig;
  const removeSet = new Set([
    ...legacy.definite2015Only,
    ...legacy.renamedIn2022,
    ...legacy.metaNoiseLabels,
  ]);
  console.log(`제거 마커 ${removeSet.size}개 (2015 + 명칭변경 + 메타 라벨)`);

  const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const records = input.records as Array<Record<string, unknown>>;
  console.log(`입력: ${records.length.toLocaleString()}건`);

  const removedByMarker: Record<string, number> = {};
  const general: Array<Record<string, unknown>> = []; // 일반고 보통교과
  const vocational: Array<Record<string, unknown>> = []; // 특성화고 전문교과
  let removedCount = 0;
  let vocationalCount = 0;

  for (const r of records) {
    const sbj = r['SBJT_NM'] as string | undefined;
    const upper = (r['UPPER_ORGA_NM'] as string | undefined) ?? '';

    // 1) 2015 마커 + 메타 노이즈 제거
    if (sbj && removeSet.has(sbj)) {
      removedByMarker[sbj] = (removedByMarker[sbj] || 0) + 1;
      removedCount++;
      continue;
    }

    // 2) 전문교과 분리
    if (upper.includes('전문교과')) {
      vocational.push(r);
      vocationalCount++;
      continue;
    }

    // 3) 나머지 = 일반고 보통교과 (2022 개정)
    general.push(r);
  }

  console.log(`\n결과:`);
  console.log(`  일반고 보통교과: ${general.length.toLocaleString()}건`);
  console.log(`  특성화고 전문교과 (분리): ${vocational.length.toLocaleString()}건`);
  console.log(`  제거 (2015 + 메타 라벨): ${removedCount.toLocaleString()}건`);
  console.log(
    `  총합 검증: ${(general.length + vocational.length + removedCount).toLocaleString()} == ${records.length.toLocaleString()}`
  );

  console.log('\n제거 분포 상위 10:');
  Object.entries(removedByMarker)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([k, v]) => console.log(`  ${v.toLocaleString().padStart(6)} | ${k}`));

  // 일반고 파일
  const outGeneral = {
    _meta: {
      ...input._meta,
      filtered2022Only: true,
      vocationalSeparated: true,
      filterAppliedAt: new Date().toISOString(),
      legacyRemoved: removedCount,
      vocationalSeparatedCount: vocationalCount,
      filterRationale:
        '2026년 4월 기준 hakjum 사용자(고1·고2)는 2022 개정 적용. 2015 개정 명칭 + 메타 라벨 제거, 전문교과는 별도 분리.',
    },
    records: general,
  };
  fs.writeFileSync(OUTPUT_GENERAL + '.tmp', JSON.stringify(outGeneral, null, 0), 'utf-8');
  fs.renameSync(OUTPUT_GENERAL + '.tmp', OUTPUT_GENERAL);
  console.log(`\n저장 (일반고): ${OUTPUT_GENERAL} (${(fs.statSync(OUTPUT_GENERAL).size / 1024 / 1024).toFixed(2)} MB)`);

  // 특성화고 파일
  const outVocational = {
    _meta: {
      ...input._meta,
      vocationalOnly: true,
      filterAppliedAt: new Date().toISOString(),
      filterRationale:
        '특성화고/마이스터고 전문교과 데이터. 일반고 추천에는 제외, 특성화고 트랙 추후 활용.',
    },
    records: vocational,
  };
  fs.writeFileSync(OUTPUT_VOCATIONAL + '.tmp', JSON.stringify(outVocational, null, 0), 'utf-8');
  fs.renameSync(OUTPUT_VOCATIONAL + '.tmp', OUTPUT_VOCATIONAL);
  console.log(`저장 (특성화고): ${OUTPUT_VOCATIONAL} (${(fs.statSync(OUTPUT_VOCATIONAL).size / 1024 / 1024).toFixed(2)} MB)`);

  // 검증
  const generalSchools = new Set(general.map((r) => r['SCHUL_CODE']));
  const generalSubjects = new Set(general.map((r) => r['SBJT_NM']));
  console.log(`\n일반고 검증:`);
  console.log(`  학교 수: ${generalSchools.size.toLocaleString()}`);
  console.log(`  유니크 과목: ${generalSubjects.size.toLocaleString()}`);
}

main();
