import { Search, ShoppingBag, Menu, User } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';


export default function Header({
  onNavigate,
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange
}: {
  onNavigate: (view: 'home' | 'store' | 'affiliate' | 'login', category?: string) => void,
  cartCount: number,
  onOpenCart: () => void,
  searchQuery: string,
  onSearchChange: (q: string) => void
}) {



  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-accent/20 px-6 md:px-20 py-6 sticky top-0 bg-primary/95 backdrop-blur-md z-50">
      <div className="flex items-center gap-12">
        <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="h-20 overflow-hidden rounded-[11px]">
            <img src={logoImg} alt="Bella Sousa Logo" className="h-full w-auto object-contain" />
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-10">
          <a className="text-slate-100 hover:text-accent transition-colors text-sm font-medium tracking-widest uppercase cursor-pointer" onClick={() => onNavigate('store', 'Lingerie')}>Lingerie</a>
          <a className="text-slate-100 hover:text-accent transition-colors text-sm font-medium tracking-widest uppercase cursor-pointer" onClick={() => onNavigate('store', 'Cosméticos')}>Cosméticos</a>
          <a className="text-slate-100 hover:text-accent transition-colors text-sm font-medium tracking-widest uppercase cursor-pointer" onClick={() => onNavigate('affiliate')}>Cadastre-se</a>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center">
          <div className="flex w-full flex-1 items-stretch rounded-full h-10 bg-primary/20 border border-primary/40 min-w-[240px]">
            <div className="text-accent flex items-center justify-center pl-4">
              <Search className="w-5 h-5" />
            </div>
            <input
              className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-slate-100 placeholder:text-slate-400 text-sm px-3"
              placeholder="Pesquisar boutique..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => onNavigate('login')}
          className="hidden md:flex items-center gap-2 text-slate-100 hover:text-accent transition-all text-[11px] font-bold uppercase tracking-widest px-4 py-2 border border-accent/20 rounded-full hover:bg-accent/5"
        >
          <User className="w-4 h-4" />
          Minha Conta
        </button>
        <button
          onClick={onOpenCart}
          className="flex items-center justify-center rounded-full h-10 w-10 bg-primary/30 text-accent hover:bg-primary/50 transition-all relative"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <button className="lg:hidden text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
