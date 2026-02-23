import { School as SchoolIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { School } from '@/types';

interface SchoolCardProps {
  school: School;
  selected: boolean;
  onClick: () => void;
}

const typeBadgeColor: Record<string, 'sky' | 'indigo' | 'amber' | 'green' | 'gray'> = {
  '일반고': 'sky',
  '특성화고': 'amber',
  '자율고': 'indigo',
  '특목고': 'green',
};

export function SchoolCard({ school, selected, onClick }: SchoolCardProps) {
  const subjectCount = school.allSubjects.length;

  return (
    <Card hover selected={selected} onClick={onClick} className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-sky-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
          <SchoolIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 truncate">{school.name}</h3>
            <Badge color={typeBadgeColor[school.type] || 'gray'}>{school.type}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            개설과목 {subjectCount}개 · {Object.keys(school.subjectsByGrade).length}개 학년
          </p>
        </div>
        <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
      </div>
    </Card>
  );
}
