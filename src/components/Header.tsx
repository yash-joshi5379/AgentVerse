import { Utensils } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const navItems = ['Search', 'Dashboard', 'My Profile'];

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onNavigate('Dashboard')}
          >
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-2xl">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl tracking-tight text-foreground">
              FindMyFood
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => onNavigate(item)}
                className={`px-4 py-2 rounded-full transition-all ${
                  currentPage === item
                    ? 'bg-primary text-white shadow-md'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="md:hidden flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => onNavigate(item)}
                className={`px-3 py-2 rounded-full transition-all ${
                  currentPage === item
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground'
                }`}
              >
                {item === 'Dashboard' ? 'Home' : item === 'My Profile' ? 'Profile' : item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
