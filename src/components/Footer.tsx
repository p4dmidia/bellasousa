import { Share2, Heart, Instagram, Facebook, Twitter } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';


export default function Footer() {
  return (
    <footer className="bg-primary pt-24 pb-12 px-6 md:px-20 border-t border-accent/10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 pb-20 border-b border-accent/10 mb-20">
          <div>
            <h2 className="text-white text-4xl md:text-5xl font-serif italic mb-4">Siga Elegante</h2>
            <p className="text-slate-400 text-lg">Junte-se à nossa lista exclusiva para acesso antecipado a novas coleções e eventos.</p>
          </div>
          <form className="flex flex-col sm:flex-row gap-0 rounded-full overflow-hidden border border-accent/30 bg-primary/50">
            <input
              className="flex-1 bg-transparent border-none px-8 py-5 text-slate-100 focus:ring-0 placeholder:text-slate-500"
              placeholder="Seu e-mail"
              type="email"
            />
            <button className="bg-accent text-primary hover:bg-white px-10 py-5 font-bold uppercase tracking-[0.2em] text-xs transition-all">
              Inscrever-se
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-6">
              <div className="h-28 overflow-hidden rounded-[11px]">
                <img src={logoImg} alt="Bella Sousa Logo" className="h-full w-auto object-contain" />
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Bella Sousa: Definindo a intimidade moderna através de processos artesanais e essências de alta performance. Elegância não é apenas uma escolha, é uma atitude.
            </p>
            <div className="flex gap-4">
              <a className="text-slate-400 hover:text-accent transition-colors" href="#"><Share2 className="w-5 h-5" /></a>
              <a className="text-slate-400 hover:text-accent transition-colors" href="#"><Heart className="w-5 h-5" /></a>
              <a className="text-slate-400 hover:text-accent transition-colors" href="#"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm uppercase tracking-widest mb-6 font-bold">Loja</h4>
            <ul className="flex flex-col gap-4 text-slate-400 text-sm">
              <li><a className="hover:text-accent transition-colors" href="#">Todas as Lingeries</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Novidades</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Seda & Renda</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Conjuntos de Cosméticos</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm uppercase tracking-widest mb-6 font-bold">Empresa</h4>
            <ul className="flex flex-col gap-4 text-slate-400 text-sm">
              <li><a className="hover:text-accent transition-colors" href="#">Nossa História</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Sustentabilidade</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Carreiras</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Fale Conosco</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm uppercase tracking-widest mb-6 font-bold">Suporte</h4>
            <ul className="flex flex-col gap-4 text-slate-400 text-sm">
              <li><a className="hover:text-accent transition-colors" href="#">Envio & Devoluções</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Guia de Tamanhos</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Perguntas Frequentes</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Política de Privacidade</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs tracking-widest uppercase">© 2024 Bella Sousa. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <span className="text-slate-500 text-[10px] tracking-widest uppercase italic">Elegância é uma atitude</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
