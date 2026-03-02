import { motion } from 'motion/react';

const collections = [
  {
    title: "Lingerie de Luxo",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrkTZIq1IuwZIpzftZnQaM388t-t1NsOsIUDYzfteKuuMYO5jQRoKoH09JseHmO1qlV7NZxQnXaK28kOH1OeMs7xQ8n9_RGlgycGifvlCm6cWSRcvGY-TjyKBRe2wxZzTSz6ZN4QV8xZSUYX4e-B6PEn-rK0vb7PTJpsr8TGchpMM43GZowG15qv0nErizKz62oPzUlbLbd2RPKCFFbL59ORleBZ6Kex3jHDhawjr6_yIa515dZBsdOUMMUyxnrJkcdOJD6zLWYpEg"
  },
  {
    title: "Cosméticos Artesanais",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_LLBjj65MaK_mDaDfqHd51QWK1MzKShe2GadDLaAaW0KO5W5P8dYluP4woZ7QBttnFtO--OxLnpgW6azLy3w1_evjYhi-OaPnJ-BSVQubmeXG8Mcq1qto9d6mJBdbGjNi10bDyLgZKA2_NFK5t5zs5Xxnm9t5mpQc3pFNgo42nK42AJQ5Bk7hUEOfozcSql0ORtVavqkH9B88BdGDutG4oDXL_XTrFdUMhzylRjHzAezxS8hdKpscZBjep-hxHmlz8ab3oPphgGNX"
  },
  {
    title: "Acessórios Exclusivos",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBfJaNjMbpJC1pOikfq5ourHNCvTifM04kyXHA4NIgT-KiESWeRCBIaA9i-zzwbI7SKnBpUKwNurTFPmWc15QRssyLitsR8Ieg0baD3HDnH2hqNrpQsynZ4bSy0oQlaKVklg7jOVrqZBoRJgXy5naJt01Pwnw-GiJebvYa18IDY-Y77lI-TWmgo3cJeXgbR0q3RYEPAp_UmyD6xqOZUODhlOqFyCvoH1hnCfeQP-d-yVe9QsJNh6hTodsFbH_yWZODuy0rHNIcHr5bv"
  }
];

export default function Collections({ onNavigate }: { onNavigate: (view: 'store', category?: string) => void }) {


  return (
    <section className="py-20 px-6 md:px-20 bg-primary/10">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-black text-3xl md:text-4xl font-serif text-center mb-16 italic">Explore Nossas Coleções</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl cursor-pointer"
              onClick={() => {
                const categoryMap: Record<string, string> = {
                  "Lingerie de Luxo": "Lingerie",
                  "Cosméticos Artesanais": "Cosméticos",
                  "Acessórios Exclusivos": "Acessórios"
                };
                onNavigate('store', categoryMap[item.title]);
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${item.image}')` }}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <h3 className="text-white text-2xl font-serif italic text-center border-b border-white/0 group-hover:border-white/100 transition-all duration-500 pb-2">
                  {item.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
