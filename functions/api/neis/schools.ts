// NEIS 전국 고등학교 목록 API 파이프라인
// GET /api/neis/schools?region=B10&name=가야고

interface Env {
  NEIS_API_KEY?: string;
}

// 시도교육청 코드 매핑 (전국 17개 시도)
const REGION_CODES: Record<string, string> = {
  B10: '서울특별시교육청',
  C10: '부산광역시교육청',
  D10: '대구광역시교육청',
  E10: '인천광역시교육청',
  F10: '광주광역시교육청',
  G10: '대전광역시교육청',
  H10: '울산광역시교육청',
  I10: '세종특별자치시교육청',
  J10: '경기도교육청',
  K10: '강원특별자치도교육청',
  M10: '충청북도교육청',
  N10: '충청남도교육청',
  P10: '전북특별자치도교육청',
  Q10: '전라남도교육청',
  R10: '경상북도교육청',
  S10: '경상남도교육청',
  T10: '제주특별자치도교육청',
};

interface NEISSchool {
  code: string;           // SD_SCHUL_CODE
  regionCode: string;     // ATPT_OFCDC_SC_CODE
  name: string;           // SCHUL_NM
  engName: string;        // ENG_SCHUL_NM
  region: string;         // LCTN_SC_NM (서울, 부산 등)
  regionFull: string;     // ATPT_OFCDC_SC_NM
  address: string;        // ORG_RDNMA + ORG_RDNDA
  type: string;           // HS_SC_NM (일반고, 특목고 등)
  foundation: string;     // FOND_SC_NM (공립, 사립)
  coedu: string;          // COEDU_SC_NM (남녀공학 등)
  homepage: string;       // HMPG_ADRES
  tel: string;            // ORG_TELNO
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const region = url.searchParams.get('region') || '';    // ATPT_OFCDC_SC_CODE
  const name = url.searchParams.get('name') || '';        // 학교명 검색
  const page = url.searchParams.get('page') || '1';
  const size = url.searchParams.get('size') || '1000';

  // 지역 코드 목록만 반환
  if (url.searchParams.get('regions') === 'true') {
    const regions = Object.entries(REGION_CODES).map(([code, name]) => ({
      code,
      name: name.replace(/교육청$/, ''),
      fullName: name,
    }));
    return new Response(JSON.stringify({ regions }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
    });
  }

  const apiKey = context.env.NEIS_API_KEY || '';
  const params = new URLSearchParams({
    Type: 'json',
    pIndex: page,
    pSize: size,
    SCHUL_KND_SC_NM: '고등학교',
  });

  if (apiKey) params.set('KEY', apiKey);
  if (region) params.set('ATPT_OFCDC_SC_CODE', region);
  if (name) params.set('SCHUL_NM', name);

  const apiUrl = `https://open.neis.go.kr/hub/schoolInfo?${params}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `NEIS API error: ${response.status}`, schools: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json() as any;

    // NEIS 에러 처리
    if (data?.RESULT) {
      return new Response(JSON.stringify({ error: data.RESULT.MESSAGE, code: data.RESULT.CODE, schools: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const info = data?.schoolInfo;
    if (!info || info.length < 2) {
      return new Response(JSON.stringify({ schools: [], totalCount: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalCount = info[0]?.head?.[0]?.list_total_count || 0;
    const rows = info[1]?.row || [];

    const schools: NEISSchool[] = rows.map((r: any) => ({
      code: r.SD_SCHUL_CODE || '',
      regionCode: r.ATPT_OFCDC_SC_CODE || '',
      name: r.SCHUL_NM || '',
      engName: r.ENG_SCHUL_NM || '',
      region: (r.LCTN_SC_NM || '').replace(/특별시|광역시|특별자치시|특별자치도|도$/g, '').trim(),
      regionFull: r.ATPT_OFCDC_SC_NM || '',
      address: `${r.ORG_RDNMA || ''} ${r.ORG_RDNDA || ''}`.trim(),
      type: r.HS_SC_NM || '일반고',
      foundation: r.FOND_SC_NM || '',
      coedu: r.COEDU_SC_NM || '',
      homepage: r.HMPG_ADRES || '',
      tel: r.ORG_TELNO || '',
    }));

    return new Response(JSON.stringify({ schools, totalCount }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), schools: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
