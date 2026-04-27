import { BookOpen, Sparkles, Heart } from 'lucide-react';
import type { MajorFull } from '@/types';
import { C } from '@/lib/design-tokens';

interface Props {
  major: MajorFull;
}

export function MajorOverviewCard({ major }: Props) {
  return (
    <div className="animate-fade-in-up">
      {major.summary && <Block icon={<BookOpen size={16} color={C.ink} />} iconBg="#dbeafe" title="이 학과는 이런 걸 배워요" body={major.summary} />}
      {major.property && <Block icon={<Sparkles size={16} color={C.ink} />} iconBg="#fef3c7" title="학과의 특성" body={major.property} />}
      {major.interest && <Block icon={<Heart size={16} color={C.ink} />} iconBg="#fee2e2" title="이런 학생에게 잘 맞아요" body={major.interest} />}

      {major.mainSubjects.length > 0 && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={16} color={C.ink} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: C.ink }}>
              대학에서 배우는 핵심과목
            </div>
          </div>
          <div style={{ background: C.bg, borderRadius: 14, padding: 16 }}>
            {major.mainSubjects.map((subj, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  paddingTop: i === 0 ? 0 : 10,
                  paddingBottom: i === major.mainSubjects.length - 1 ? 0 : 10,
                  borderBottom: i === major.mainSubjects.length - 1 ? 'none' : `1px solid ${C.line}`,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    background: C.brand,
                    marginTop: 8,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
                    {subj.name}
                  </div>
                  {subj.desc && (
                    <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>{subj.desc}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ icon, iconBg, title, body }: { icon: React.ReactNode; iconBg: string; title: string; body: string }) {
  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: C.ink }}>{title}</div>
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.85,
          color: C.ink,
          letterSpacing: '-0.015em',
          paddingLeft: 2,
          whiteSpace: 'pre-line',
        }}
      >
        {body}
      </div>
    </div>
  );
}
