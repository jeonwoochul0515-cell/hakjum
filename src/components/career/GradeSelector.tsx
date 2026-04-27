import { C } from '@/lib/design-tokens';

interface GradeSelectorProps {
  value: string;
  onChange: (grade: string) => void;
}

const grades = ['2학년', '3학년'];

export function GradeSelector({ value, onChange }: GradeSelectorProps) {
  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.025em', color: C.ink }}>
        수강 학년
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {grades.map((g) => {
          const active = value === g;
          return (
            <button
              key={g}
              onClick={() => onChange(g)}
              className="cursor-pointer transition-colors"
              style={{
                padding: 16,
                fontSize: 14,
                fontWeight: 700,
                background: active ? C.brand : '#fff',
                color: active ? '#fff' : C.ink,
                border: `1.5px solid ${active ? C.brand : C.line}`,
                borderRadius: 12,
                letterSpacing: '-0.02em',
              }}
            >
              {g}
            </button>
          );
        })}
      </div>
    </div>
  );
}
