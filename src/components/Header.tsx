import { Search, ShoppingBag, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logoImg from '../assets/logo.jpeg';


export default function Header({
  onNavigate,
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange
}: {
  onNavigate: (view: 'home' | 'store' | 'affiliate' | 'login' | 'admin', category?: string) => void,
  cartCount: number,
  onOpenCart: () => void,
  searchQuery: string,
  onSearchChange: (q: string) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (view: any, category?: string) => {
    onNavigate(view, category);
    setIsMenuOpen(false);
  };



  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-accent/20 px-6 md:px-20 py-6 sticky top-0 bg-primary/95 backdrop-blur-md z-50">
      <div className="flex items-center gap-12">
        <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="h-20 overflow-hidden rounded-[11px]">
            <img src={logoImg} alt="Bella Sousa Logo" className="h-full w-auto object-contain" />
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-10">
          <a className="text-slate-100 hover:text-accent transition-colors text-sm font-medium tracking-widest uppercase cursor-pointer" onClick={() => handleNavigate('store')}>Loja Virtual</a>
          <a className="text-slate-100 hover:text-accent transition-colors text-sm font-medium tracking-widest uppercase cursor-pointer" onClick={() => handleNavigate('store', 'Lingerie')}>Lingerie</a>
          <a className="text-slate-100 hover:text-accent transition-colors text-sm font-medium tracking-widest uppercase cursor-pointer" onClick={() => handleNavigate('store', 'Cosméticos')}>Cosméticos</a>
          <a className="text-slate-100 hover:text-accent transition-colors text-sm font-medium tracking-widest uppercase cursor-pointer" onClick={() => handleNavigate('store', 'Casa')}>Casa</a>
          <a className="text-slate-100 hover:text-accent transition-colors text-sm font-medium tracking-widest uppercase cursor-pointer" onClick={() => handleNavigate('affiliate')}>Cadastre-se</a>
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
          Escritório Virtual
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
        <button className="lg:hidden text-white p-2" onClick={() => setIsMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Menu Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm border-r border-accent/20 z-[999] p-8 shadow-2xl mobile-menu-drawer-solid"
            >
              <div className="flex justify-between items-center mb-12">
                <div className="h-10 overflow-hidden rounded-[8px]">
                  <img src={logoImg} alt="Logo" className="h-full w-auto" />
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-white p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col gap-8">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-accent/60">Navegação</p>
                  <nav className="flex flex-col gap-6">
                    <a className="text-white text-xl font-serif" onClick={() => handleNavigate('home')}>Início</a>
                    <a className="text-white text-xl font-serif" onClick={() => handleNavigate('store')}>Loja Virtual</a>
                    <a className="text-white text-xl font-serif" onClick={() => handleNavigate('store', 'Lingerie')}>Lingerie</a>
                    <a className="text-white text-xl font-serif" onClick={() => handleNavigate('store', 'Cosméticos')}>Cosméticos</a>
                    <a className="text-white text-xl font-serif" onClick={() => handleNavigate('store', 'Casa')}>Casa</a>
                    <a className="text-white text-xl font-serif" onClick={() => handleNavigate('affiliate')}>Cadastre-se</a>
                  </nav>
                </div>

                <div className="h-px bg-accent/10" />

                <div className="space-y-6">
                  <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-accent/60">Sua Conta</p>
                  <button
                    onClick={() => handleNavigate('login')}
                    className="flex items-center gap-3 text-white text-lg font-serif"
                  >
                    <User className="w-5 h-5 text-accent" />
                    Escritório Virtual
                  </button>
                </div>

                <div className="mt-12">
                  <div className="flex items-stretch rounded-xl h-12 bg-white/5 border border-white/10 group focus-within:border-accent/40 transition-all">
                    <div className="text-accent/60 flex items-center justify-center pl-4">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 text-sm px-3"
                      placeholder="Pesquisar..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
