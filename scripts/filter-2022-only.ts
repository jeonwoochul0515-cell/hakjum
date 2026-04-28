/**
 * 학교알리미 sync 결과에서 2015 개정 교육과정 과목을 제거하고
 * 2022 개정 적용 학생(고1·고2) 추천에만 사용할 데이터를 생성한다.
 *
 * 배경: 2026년 4월 기준 hakjum 사용자는 100% 2022 개정 적용 학생.
 * - 고3은 선택과목 결정 완료 → hakjum 대상 X
 * - 고2는 2025년에 입학 → 2022 개정
 * - 고1은 2026년에 입학 → 2022 개정
 *
 * 입력: data/schoolinfo/api24-04-2025-d20.json (78,521건)
 * 출력: data/schoolinfo/api24-04-2025-d20-2022only.json (~61,000건 예상)
 */

import * as fs from 'fs';
import * as path from 'path';

const LEGACY_FILE = path.resolve(process.cwd(), 'src/data/curriculum-2015-legacy.json');
const INPUT_FILE = path.resolve(process.cwd(), 'data/schoolinfo/api24-04-2025-d20.json');
const OUTPUT_FILE = path.resolve(
  process.cwd(),
  'data/schoolinfo/api24-04-2025-d20-2022only.json'
);

interface LegacyConfig {
  definite2015Only: string[];
  renamedIn2022: string[];
}

function main() {
  const legacy = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf-8')) as LegacyConfig;
  const removeSet = new Set([...legacy.definite2015Only, ...legacy.renamedIn2022]);
  console.log(`제거 마커 ${removeSet.size}개 로드`);

  const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const records = input.records as Array<Record<string, unknown>>;
  console.log(`입력: ${records.length.toLocaleString()}건`);

  const removed: Record<string, number> = {};
  const kept: Array<Record<string, unknown>> = [];

  for (const r of records) {
    const sbj = r['SBJT_NM'] as string | undefined;
    if (sbj && removeSet.has(sbj)) {
      removed[sbj] = (removed[sbj] || 0) + 1;
      continue;
    }
    kept.push(r);
  }

  const totalRemoved = records.length - kept.length;
  console.log(
    `제거: ${totalRemoved.toLocaleString()}건 (${((totalRemoved / records.length) * 100).toFixed(1)}%)`
  );
  console.log(`유지: ${kept.length.toLocaleString()}건`);
  console.log('\n제거 분포 (상위 15):');
  Object.entries(removed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([k, v]) => console.log(`  ${v.toLocaleString().padStart(6)} | ${k}`));

  const output = {
    _meta: {
      ...input._meta,
      filtered2022Only: true,
      filterAppliedAt: new Date().toISOString(),
      legacyRemoved: totalRemoved,
      legacyMarkerCount: removeSet.size,
      removedBreakdown: removed,
      filterRationale:
        '2026년 4월 기준 hakjum 사용자(고1·고2)는 모두 2022 개정 적용. 2015 개정 명칭 과목 모두 제거.',
    },
    records: kept,
  };

  const tmp = OUTPUT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(output, null, 0), 'utf-8');
  fs.renameSync(tmp, OUTPUT_FILE);
  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
  console.log(`\n저장: ${OUTPUT_FILE} (${sizeMB} MB)`);

  // 검증: 학교 수, 유니크 과목 수
  const schools = new Set(kept.map((r) => r['SCHUL_CODE']));
  const subjects = new Set(kept.map((r) => r['SBJT_NM']));
  console.log(`\n검증:`);
  console.log(`  학교 수: ${schools.size.toLocaleString()}`);
  console.log(`  유니크 과목: ${subjects.size.toLocaleString()}`);
}

main();
