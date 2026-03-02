import { motion } from 'motion/react';
import bannerImg from '../assets/banner.png';


export default function Hero({ onNavigate }: { onNavigate: (view: 'store', category?: string) => void }) {


  return (
    <section className="relative">
      <div className="w-full min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(60, 30, 30, 0.4), rgba(60, 30, 30, 0.95)), url('${bannerImg}')`
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <h3 className="text-accent uppercase tracking-[0.3em] text-sm mb-6 font-semibold">Coleção Exclusiva</h3>
          <h1 className="text-white text-5xl md:text-8xl font-serif italic mb-8 leading-[1.1]">A Arte da Intimidade</h1>
          <p className="text-slate-300 text-lg md:text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">Onde o Luxo encontra o Bem-Estar. Descubra uma curadoria exclusiva de moda íntima em seda e cosméticos artesanais pensados para a mulher sofisticada.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary" onClick={() => onNavigate('store', 'Lingerie')}>
              Comprar Lingerie
            </button>
            <button className="btn-outline" onClick={() => onNavigate('store', 'Cosméticos')}>
              Explorar Cosméticos
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
