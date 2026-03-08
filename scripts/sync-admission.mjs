#!/usr/bin/env node
/**
 * 대학별 입시 교과이수기준 자동 동기화 스크립트
 *
 * 데이터 소스:
 *  1. 대교협(adiga.kr) 「2028 권역별 대학별 권장과목」 Excel
 *  2. 대교협 「2028 계열별 대표 모집단위별 반영과목」 Excel
 *  3. 주요 대학 입학본부 공지 페이지 스크래핑
 *
 * 사용법:
 *   node scripts/sync-admission.mjs
 *
 * 출력:
 *   data/admission-crawled.json — 크롤링된 대학별 교과이수기준
 *   자동으로 src/data/admission-requirements.ts 의 UNIVERSITY_SPECIFIC 업데이트
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_JSON = join(ROOT, 'data', 'admission-crawled.json');

// ── 1. adiga.kr Excel 다운로드 + 파싱 ──

const ADIGA_FILES = [
  {
    name: '2028학년도 권역별 대학별 권장과목',
    url: 'https://www.adiga.kr/cmm/com/file/fileDown.do?fileId=00000000000000247123&fileSn=1',
    type: 'university-subjects',
  },
  {
    name: '2028학년도 계열별 대표 모집단위별 반영과목',
    url: 'https://www.adiga.kr/cmm/com/file/fileDown.do?fileId=00000000000000247034&fileSn=1',
    type: 'major-subjects',
  },
];

async function downloadExcel(url, label) {
  console.log(`  ↓ 다운로드: ${label}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
        'Referer': 'https://www.adiga.kr/',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      console.log(`  ⚠ HTTP ${res.status} — 스킵`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());

    // Excel 파일인지 확인
    if (contentType.includes('spreadsheet') || contentType.includes('octet-stream') || buf[0] === 0x50) {
      console.log(`  ✓ ${(buf.length / 1024).toFixed(0)}KB 다운로드 완료`);
      return buf;
    }

    // HTML이 반환된 경우 (세션 만료 등)
    console.log(`  ⚠ Excel이 아닌 응답 (${contentType}) — 스킵`);
    return null;
  } catch (err) {
    console.log(`  ⚠ 다운로드 실패: ${err.message}`);
    return null;
  }
}

async function parseExcel(buffer, type) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'buffer' });

  const results = [];
  const sheet = wb.Sheets[wb.SheetNames[0]]; // 첫 번째 시트
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rows.length < 5) return results;

  // adiga.kr Excel 구조: [권역, 지역, 대학명, 모집단위(계열/단과대/학과), ?, 핵심과목, 권장과목, 비고, ?]
  // 헤더는 row 2-3 (병합셀)
  // 데이터는 row 4부터
  console.log(`  📋 총 ${rows.length}행 (헤더 4행 + 데이터 ${rows.length - 4}행)`);

  const parseSubjects = (str) =>
    String(str).split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s !== '-' && s !== '');

  // 대학별로 그룹핑 (같은 대학의 같은 계열은 합침)
  const grouped = new Map();

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const university = String(row[2] || '').trim();
    const category = String(row[3] || '').trim();
    const requiredStr = String(row[5] || '').trim();
    const recommendedStr = String(row[6] || '').trim();
    const notes = String(row[7] || '').trim();

    if (!university || university.length < 2) continue;
    // "진로 및 적성을 고려하여" 같은 일반 안내문은 스킵
    if (requiredStr.includes('고려하여') && !recommendedStr) continue;

    const required = parseSubjects(requiredStr);
    const recommended = parseSubjects(recommendedStr);

    if (required.length === 0 && recommended.length === 0) continue;

    // 대학+계열 기준 그룹핑 (계열은 단과대 수준으로 정리)
    const collegeCategory = categorizeCollege(category);
    const key = `${university}__${collegeCategory}`;

    if (grouped.has(key)) {
      const existing = grouped.get(key);
      // 과목 병합 (중복 제거)
      for (const s of required) {
        if (!existing.requiredSubjects.includes(s)) existing.requiredSubjects.push(s);
      }
      for (const s of recommended) {
        if (!existing.recommendedSubjects.includes(s)) existing.recommendedSubjects.push(s);
      }
    } else {
      grouped.set(key, {
        university,
        category: collegeCategory,
        requiredSubjects: [...required],
        recommendedSubjects: [...recommended],
        notes,
        source: 'adiga-excel-2028',
        sourceUrl: 'https://www.adiga.kr/uct/ces/archiveView.do?menuId=PCUCTCES1000&prtlBbsId=26239',
        sourceDate: '2026-02-20',
      });
    }
  }

  return Array.from(grouped.values());
}

// 단과대/학과명을 계열로 분류
function categorizeCollege(name) {
  const n = name.toLowerCase();
  if (/의과|의학|의예/.test(n)) return '의약계열';
  if (/약학|약대/.test(n)) return '의약계열';
  if (/치과|치의|치대/.test(n)) return '의약계열';
  if (/간호/.test(n)) return '의약계열';
  if (/수의/.test(n)) return '의약계열';
  if (/공과|공학|건축|전자|전기|기계|화공|컴퓨터|소프트웨어|IT|정보통신|신소재|반도체/.test(n)) return '이공계열';
  if (/자연과학|이과|수학|물리|화학|생명|생물|지구|통계|천문/.test(n)) return '자연계열';
  if (/경영|경제|상경|통상|무역/.test(n)) return '상경계열';
  if (/법과|법학|로스쿨/.test(n)) return '인문·사회계열';
  if (/사범|교육/.test(n)) return '교육계열';
  if (/미술|음악|체육|예술|디자인|연극|무용/.test(n)) return '예체능계열';
  if (/인문|문과|어문|국문|영문|철학|역사|사학/.test(n)) return '인문계열';
  if (/사회|정치|행정|심리|사회복지|언론/.test(n)) return '사회계열';
  if (/농업|농대|농생명|식품|환경|생활과학/.test(n)) return '자연계열';
  if (/자유전공|첨단융합/.test(n)) return '전체';
  return name; // 분류 못하면 원본 유지
}

// ── 2. 대학 입학본부 공지 페이지 크롤링 ──

const UNIVERSITY_PAGES = [
  {
    university: '서울대학교',
    url: 'https://admission.snu.ac.kr/undergraduate/notice',
    searchKeyword: '교과이수|전공 연계|과목 선택',
  },
  {
    university: '연세대학교',
    url: 'https://admission.yonsei.ac.kr/seoul/admission/notice.do',
    searchKeyword: '교과이수|권장과목',
  },
  {
    university: '고려대학교',
    url: 'https://oku.korea.ac.kr/oku/cms/FR_CON/BoardView.do?MENU_ID=650',
    searchKeyword: '교과이수|권장과목|2028',
  },
];

async function scrapeUniversityNotices() {
  const notices = [];

  for (const uni of UNIVERSITY_PAGES) {
    console.log(`  🔍 ${uni.university} 공지 확인...`);
    try {
      const res = await fetch(uni.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        console.log(`  ⚠ ${uni.university}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();

      // 2028 교과이수 관련 공지 찾기
      const regex = new RegExp(uni.searchKeyword, 'gi');
      const matches = html.match(regex);

      if (matches && matches.length > 0) {
        console.log(`  ✓ ${uni.university}: "${matches[0]}" 등 ${matches.length}건 관련 공지 발견`);
        notices.push({
          university: uni.university,
          url: uni.url,
          foundKeywords: [...new Set(matches)],
          checkedAt: new Date().toISOString(),
        });
      } else {
        console.log(`  · ${uni.university}: 관련 공지 없음`);
      }
    } catch (err) {
      console.log(`  ⚠ ${uni.university}: ${err.message}`);
    }
  }

  return notices;
}

// ── 3. adiga.kr 목록 페이지에서 최신 파일 ID 자동 탐지 ──

async function findLatestAdigaFiles() {
  console.log('  🔍 adiga.kr 최신 자료 탐색...');

  // 자료실 목록 페이지에서 fnDownloadAll JSON 내 실제 downloadUrl 추출
  const targetPages = [
    { bbsId: '26239', label: '2028 모집단위별 반영과목 및 대학별 권장과목' },
  ];

  const files = [];

  for (const page of targetPages) {
    try {
      const url = `https://www.adiga.kr/uct/ces/archiveView.do?menuId=PCUCTCES1000&prtlBbsId=${page.bbsId}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;
      const html = await res.text();

      // fnDownloadAll([...]) 내 JSON에서 실제 downloadUrl 추출
      const fnMatches = [...html.matchAll(/fnDownloadAll\((\[[\s\S]*?\])\)/g)];
      for (const m of fnMatches) {
        try {
          const cleaned = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          const arr = JSON.parse(cleaned);
          for (const f of arr) {
            if (f.atchFileNm && f.atchFileNm.endsWith('.xlsx') && f.downloadUrl) {
              const downloadUrl = f.downloadUrl.replace(/\\u0026/g, '&').replace(/\\\//g, '/');
              console.log(`    📄 ${f.atchFileNm} (${(f.fileSz / 1024).toFixed(0)}KB)`);
              files.push({
                url: downloadUrl.startsWith('http') ? downloadUrl : `https://adiga.kr${downloadUrl}`,
                title: f.atchFileNm,
                fileId: f.fileId,
                fileSn: f.fileSn,
                size: parseInt(f.fileSz),
                regDate: f.sysRegDt,
              });
            }
          }
        } catch {
          // JSON 파싱 실패 — 스킵
        }
      }
    } catch (err) {
      console.log(`  ⚠ 페이지 ${page.bbsId} 접근 실패: ${err.message}`);
    }
  }

  // 2028 관련 파일만 필터
  const relevant = files.filter(f =>
    f.title.includes('2028') && (f.title.includes('권장과목') || f.title.includes('반영과목'))
  );

  console.log(`  ✓ ${relevant.length}개 관련 Excel 파일 발견`);
  return relevant;
}

// ── 4. 기존 정적 데이터와 병합 ──

function mergeWithExisting(crawledData) {
  // 기존 admission-requirements.ts의 UNIVERSITY_SPECIFIC 데이터 로드
  const existingPath = join(ROOT, 'data', 'admission-crawled.json');
  let existing = [];
  if (existsSync(existingPath)) {
    try {
      existing = JSON.parse(readFileSync(existingPath, 'utf-8')).universities || [];
    } catch {}
  }

  // 크롤링 데이터를 대학+계열 키로 병합 (최신 데이터 우선)
  const merged = new Map();

  // 기존 데이터 먼저
  for (const item of existing) {
    const key = `${item.university}__${item.category}`;
    merged.set(key, item);
  }

  // 크롤링 데이터로 덮어쓰기
  for (const item of crawledData) {
    const key = `${item.university}__${item.category}`;
    merged.set(key, { ...item, updatedAt: new Date().toISOString() });
  }

  return Array.from(merged.values());
}

// ── 5. TypeScript 코드 자동 생성 ──

function generateTypeScript(universities) {
  if (universities.length === 0) return null;

  const lines = universities.map((u) => {
    const req = JSON.stringify(u.requiredSubjects || []);
    const rec = JSON.stringify(u.recommendedSubjects || []);
    const notes = (u.notes || '').replace(/'/g, "\\'");
    return `  {
    university: '${u.university}',
    category: '${u.category}',
    requiredSubjects: ${req},
    recommendedSubjects: ${rec},
    notes: '${notes}',
  }`;
  });

  return lines.join(',\n');
}

// ── 메인 실행 ──

async function main() {
  console.log('══════════════════════════════════════════════');
  console.log('  대학별 입시 교과이수기준 자동 동기화');
  console.log(`  실행: ${new Date().toISOString()}`);
  console.log('══════════════════════════════════════════════\n');

  const allData = [];

  // Step 1: adiga.kr 최신 파일 탐지
  console.log('[1/4] adiga.kr 최신 파일 탐지');
  const latestFiles = await findLatestAdigaFiles();

  // Step 2: Excel 다운로드 + 파싱
  console.log('\n[2/4] Excel 파일 다운로드 + 파싱');
  // 자동 탐지 파일 우선, 없으면 하드코딩 폴백
  const downloadTargets = latestFiles.length > 0
    ? latestFiles.map(f => ({ name: f.title, url: f.url, type: 'auto', regDate: f.regDate }))
    : ADIGA_FILES;

  for (const file of downloadTargets) {
    const buf = await downloadExcel(file.url, file.name);
    if (buf) {
      try {
        const parsed = await parseExcel(buf, file.type);
        console.log(`  ✓ ${parsed.length}건 파싱 완료`);
        allData.push(...parsed);
      } catch (err) {
        console.log(`  ⚠ 파싱 오류: ${err.message}`);
      }
    }
  }

  // Step 3: 대학 공지 페이지 확인
  console.log('\n[3/4] 대학 입학본부 공지 확인');
  const notices = await scrapeUniversityNotices();

  // Step 4: 저장
  console.log('\n[4/4] 데이터 저장');
  const merged = mergeWithExisting(allData);

  const output = {
    lastSync: new Date().toISOString(),
    source: 'adiga.kr + university admission pages',
    totalUniversities: [...new Set(merged.map(u => u.university))].length,
    totalEntries: merged.length,
    universities: merged,
    notices,
  };

  writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n  ✓ ${OUTPUT_JSON} 저장 완료`);
  console.log(`    대학 ${output.totalUniversities}개, 항목 ${output.totalEntries}건`);

  // TypeScript 코드 업데이트 안내
  if (merged.length > 0) {
    const tsSnippet = generateTypeScript(merged);
    const tsOutputPath = join(ROOT, 'data', 'admission-generated.ts.txt');
    writeFileSync(tsOutputPath, tsSnippet, 'utf-8');
    console.log(`  ✓ ${tsOutputPath} 생성 — 수동 확인 후 적용 가능`);
  }

  // 변경 사항 요약
  console.log('\n══════════════════════════════════════════════');
  if (allData.length > 0) {
    console.log(`  ✅ 크롤링 성공: ${allData.length}건 신규 데이터`);
  } else {
    console.log('  ⚠ 크롤링된 신규 데이터 없음 (Excel 다운로드 실패 가능)');
    console.log('    → 정적 데이터(admission-requirements.ts) 유지');
  }
  if (notices.length > 0) {
    console.log(`  📢 대학 공지 변경 감지: ${notices.map(n => n.university).join(', ')}`);
  }
  console.log('══════════════════════════════════════════════');
}

main().catch(console.error);
