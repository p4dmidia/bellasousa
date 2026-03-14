import { useState } from 'react';
import { ChevronDown, Heart, ShoppingBag, Plus, ArrowRight, Instagram, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

const relatedProducts = [
  {
    name: "Robe de Cetim de Seda",
    price: "R$ 320,00",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAe2tgSWk56ZImzjxL_9PzVZ9qCt-EcQOkFQLwhTrGtsPKUgB6n8eG2vlXYXkVzDBiSRVRpbnRd4DRFLf_dBQPSml1vcQp5CBqgdMT0LPfLLkY74ckauGzB1AEblSf7ZsEB6ZE82fZcXOUpZK36do7dMcvp3FX-qXNqJSiuEfEjKt1788NQhxCpXR1Na1ZmMCePuQ9vJW6sr2k2Pz4ZZw-VF3O5ZaE3UnOgnuqahbvFC4wick_Lr2k8mnx2OBcUwDMnNeOL7P5WbDc9"
  },
  {
    name: "Máscara de Renda Chantilly",
    price: "R$ 85,00",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6Siwu_Q9LesAP1uYrLc-JrcKdJ0cuNhh5pJGVoRDY57XEyx2w810ZKpZuwQfNyH1tfrPJuUdV8yw4HzaWnURve5A_lOpvfZaUW50XC6u_RXD6-FsOcBpqrRH-NA-a2vu8l43L-Xb5Yl6f2p2qvm45mZHR-HDOhLHnmAgfrlkIrsvD_rNU9Nc5eshQ8clR1yKrOBwrwf4bKq3UcnGyts-AraQxE5b640UxcF0rU0Qosuzgifq2vEcVAcgym7KSM5bXLJ7xqQ2ROKs7"
  },
  {
    name: "Meias Bordadas",
    price: "R$ 65,00",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3ZvILAiOjC2-s1IEzXi7A_x2fXuXJcnCGTcx8Mu9KE26B-NKKJsjThUvCj6TdtkkKNqlhzpf7cjReX9B_vheqi56WvK6yXbEyy2lH_KD53-d_TrLT6lo1ow-BbP_9HiMut4rSaRO7GDf7w5Z6vV6tpD-wwuYh9nz4s33AZn8OqAXuNm5wGYk9s2wRFZ8o74H-2ZoFHuzALKR4Tu-uLZXOXxkdK4jiR_EV3rSTmE9rxq5QleSk7iLt2yWkmyOLNrUTrHpDbUHEZ6sI"
  },
  {
    name: "Nocturnal Rose EDP",
    price: "R$ 180,00",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqOPlTnfyKqgJR2cylQo0TovU7oV5av0MRdt2D5Gcn-K3tBTevrVTamwAE-h9j5cHw5XaQidICVDC3uNqvYSN-7TwU3fRJNjdV2MnT_cdF71-WbBH6SrlLerbwWv19o5wA8FOlZGh5j7tWUSSDkvOEPM59Dq5QbMeSnrVynTJgU8OAyID8Q5c9Orn6mtnPqzXQiJz6j7H183QJx_XXvvnowN8vgpbQAE2OsJtiD4OsiPL7t0yzuqF3qCiDD0DZEGmYAl5odu8LAltD"
  }
];

export default function ProductDetail({ product, onBack, onAddToCart }: { product: any, onBack: () => void, onAddToCart: () => void }) {

  const [selectedSize, setSelectedSize] = useState('P');
  const [selectedColor, setSelectedColor] = useState('Borgonha');

  if (!product) return null;

  return (
    <div className="bg-bg-dark min-h-screen">
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10">
        <div className="flex flex-wrap gap-2 mb-8 text-xs uppercase tracking-[0.2em] text-slate-500">
          <button onClick={onBack} className="hover:text-accent">Loja</button>
          <span>/</span>
          <span className="text-accent">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Image Gallery */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="col-span-2 aspect-[4/5] rounded-xl overflow-hidden bg-primary/10">
              <img
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                src={product.image_url}
                alt={product.name}
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Additional images could be here if available */}
          </div>

          {/* Product Info */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="sticky top-28">
              <div className="mb-2">
                <span className="text-accent text-xs font-bold uppercase tracking-widest">{product.category || 'Destaque'}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl mb-4 text-slate-100 font-serif">{product.name}</h1>
              <p className="text-2xl text-slate-300 mb-8">R$ {product.price.toFixed(2)}</p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-400">Cor: <span className="text-slate-100">{selectedColor}</span></h3>
                  <div className="flex gap-4">
                    {/* Mocked colors for now, usually would come from variations table */}
                    <button
                      onClick={() => setSelectedColor('Borgonha')}
                      className={`w-8 h-8 rounded-full bg-[#3d1f1f] ring-2 ring-offset-2 ring-offset-bg-dark transition-all ${selectedColor === 'Borgonha' ? 'ring-accent' : 'ring-transparent'}`}
                    />
                    <button
                      onClick={() => setSelectedColor('Preto')}
                      className={`w-8 h-8 rounded-full bg-[#000000] hover:scale-110 transition-all border border-slate-700 ring-2 ring-offset-2 ring-offset-bg-dark ${selectedColor === 'Preto' ? 'ring-accent' : 'ring-transparent'}`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Selecionar Tamanho</h3>
                    <button className="text-[10px] uppercase underline tracking-widest hover:text-accent">Guia de Tamanhos</button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['PP', 'P', 'M', 'G'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 text-sm border transition-colors rounded-lg ${selectedSize === size ? 'border-accent bg-primary/20' : 'border-primary/40 hover:border-accent'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    className="flex-1 bg-accent hover:bg-accent/90 text-primary font-bold py-4 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                    onClick={onAddToCart}
                  >
                    Adicionar à Sacola
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                  <button className="p-4 border border-primary/40 rounded-xl hover:border-accent transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                <div className="border-t border-primary/20 pt-8 space-y-6">
                  <details className="group" open>
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <h3 className="text-xs font-bold uppercase tracking-widest">Descrição do Produto</h3>
                      <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pt-4 text-sm leading-relaxed text-slate-400" dangerouslySetInnerHTML={{ __html: product.description || "Nenhuma descrição disponível." }} />
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar section could be added below, fetching based on category_id */}
      </main>

      {/* Footer implementation usually in Footer.tsx, but kept here for now as requested */}
    </div>
  );
}
