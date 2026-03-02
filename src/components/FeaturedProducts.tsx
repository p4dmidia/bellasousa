import { motion } from 'motion/react';

const products = [
  {
    id: 101,
    name: "Sérum Artesanal",
    price: 45.00,
    category: "Cosméticos",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_LLBjj65MaK_mDaDfqHd51QWK1MzKShe2GadDLaAaW0KO5W5P8dYluP4woZ7QBttnFtO--OxLnpgW6azLy3w1_evjYhi-OaPnJ-BSVQubmeXG8Mcq1qto9d6mJBdbGjNi10bDyLgZKA2_NFK5t5zs5Xxnm9t5mpQc3pFNgo42nK42AJQ5Bk7hUEOfozcSql0ORtVavqkH9B88BdGDutG4oDXL_XTrFdUMhzylRjHzAezxS8hdKpscZBjep-hxHmlz8ab3oPphgGNX"
  },
  {
    id: 102,
    name: "Robe de Seda Boutique",
    price: 320.00,
    category: "Lingerie",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrkTZIq1IuwZIpzftZnQaM388t-t1NsOsIUDYzfteKuuMYO5jQRoKoH09JseHmO1qlV7NZxQnXaK28kOH1OeMs7xQ8n9_RGlgycGifvlCm6cWSRcvGY-TjyKBRe2wxZzTSz6ZN4QV8xZSUYX4e-B6PEn-rK0vb7PTJpsr8TGchpMM43GZowG15qv0nErizKz62oPzUlbLbd2RPKCFFbL59ORleBZ6Kex3jHDhawjr6_yIa515dZBsdOUMMUyxnrJkcdOJD6zLWYpEg"
  },
  {
    id: 103,
    name: "Conjunto de Pincéis Premium",
    price: 85.00,
    category: "Acessórios",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBfJaNjMbpJC1pOikfq5ourHNCvTifM04kyXHA4NIgT-KiESWeRCBIaA9i-zzwbI7SKnBpUKwNurTFPmWc15QRssyLitsR8Ieg0baD3HDnH2hqNrpQsynZ4bSy0oQlaKVklg7jOVrqZBoRJgXy5naJt01Pwnw-GiJebvYa18IDY-Y77lI-TWmgo3cJeXgbR0q3RYEPAp_UmyD6xqOZUODhlOqFyCvoH1hnCfeQP-d-yVe9QsJNh6hTodsFbH_yWZODuy0rHNIcHr5bv"
  },
  {
    id: 104,
    name: "Bodysuit de Renda Midnight",
    price: 245.00,
    category: "Lingerie",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6FUBoNtrvOHL1z3taG4BHmGnkr35bPhvL62o_MEdFZm94OxCnGqpoOWRH9mImTDk1q5dYRQmFE7A31CSoTYMhmg3nU6yK-UjSoEjIETIMz_6yRcNYxM85HRLh_FmhzZSsqHqaE2Pn2LL8m37eUuyd8FBJaao9Vgx_kQuuatTMDMoUJDtZcg9J9Zk8jxPcIpFKL4vPHYIGFaJo9EWA9TkrDfuWar4lmFJ062QaX-RVVtXEQOUU2gWpJ9_CLciWCMhez8_vzxrm1hCv"
  }
];

export default function FeaturedProducts({ onProductClick, onAddToCart }: { onProductClick: () => void, onAddToCart: (product: any) => void }) {

  return (
    <section className="py-24 px-6 md:px-20 bg-primary/95">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-accent text-sm uppercase tracking-[0.3em] mb-4 font-bold">O Ritual de Beleza</h2>
            <h3 className="text-white text-4xl md:text-5xl font-serif">Essenciais da Estação</h3>
            <p className="text-slate-400 mt-4 text-lg font-light">Fórmulas ricas, texturas luxuosas. Nossos produtos são selecionados para transformar seu cuidado diário em um momento de pura indulgência.</p>
          </div>
          <button
            className="text-accent border-b border-accent/30 pb-1 hover:border-accent transition-all text-sm uppercase tracking-widest font-semibold cursor-pointer"
            onClick={onProductClick}
          >
            Ver Catálogo Completo
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group product-card flex flex-col gap-5 cursor-pointer"
              onClick={onProductClick}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-accent/5">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                  style={{ backgroundImage: `url('${product.image}')` }}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <button
                    className="w-full bg-white text-primary py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                  >
                    Adicionar à Sacola
                  </button>
                </div>
              </div>
              <div className="text-center">
                <p className="text-accent/60 text-[10px] uppercase tracking-widest font-bold mb-1">{product.category}</p>
                <h4 className="text-slate-100 text-lg font-serif mb-1 group-hover:text-accent transition-colors">{product.name}</h4>
                <p className="text-accent text-sm font-medium tracking-wider font-bold">R$ {product.price.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
