import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
          <img src="/butterfly.svg" alt="학점나비" className="w-7 h-7" />
          <span className="text-lg font-bold bg-gradient-to-r from-sky-primary to-indigo-primary bg-clip-text text-transparent">
            학점나비
          </span>
        </button>
      </div>
    </header>
  );
}
