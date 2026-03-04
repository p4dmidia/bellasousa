import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import banner1 from '../assets/banner.png';
import banner2 from '../assets/banner2.png';
import banner_casa from '../assets/banner_casa.png';

const slides = [
  {
    image: banner1,
    title: "Moda Íntima de Luxo",
    category: "Lingerie"
  },
  {
    image: banner2,
    title: "Cosméticos Artesanais",
    category: "Cosméticos"
  },
  {
    image: banner_casa,
    title: "Bem-Estar em Casa",
    category: "Casa"
  }
];

export default function Hero({ onNavigate }: { onNavigate: (view: 'store', category?: string) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative">
      <div className="w-full min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Imagem de Fundo (Troca direta sem transição) */}
        <div
          key={currentSlide}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(60, 30, 30, 0.4), rgba(60, 30, 30, 0.95)), url('${slides[currentSlide].image}')`
          }}
        />

        <motion.div
          key={`content-${currentSlide}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <h1 className="text-white text-5xl md:text-8xl font-serif italic mb-12 leading-[1.1]">
            {slides[currentSlide].title}
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary" onClick={() => onNavigate('store', slides[currentSlide].category)}>
              Conhecer Coleção
            </button>
          </div>
        </motion.div>

        {/* Indicadores do Carrossel */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-accent w-8' : 'bg-white/30'
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
