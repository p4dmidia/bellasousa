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

export default function ProductDetail({ onBack, onAddToCart }: { onBack: () => void, onAddToCart: () => void }) {

  const [selectedSize, setSelectedSize] = useState('P');
  const [selectedColor, setSelectedColor] = useState('Borgonha');

  return (
    <div className="bg-bg-dark min-h-screen">
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-10">
        <div className="flex flex-wrap gap-2 mb-8 text-xs uppercase tracking-[0.2em] text-slate-500">
          <button onClick={onBack} className="hover:text-accent">Lingerie</button>
          <span>/</span>
          <a className="hover:text-accent" href="#">Bodysuits</a>
          <span>/</span>
          <span className="text-accent">Bodysuit de Renda Etéreo</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Image Gallery */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="col-span-2 aspect-[4/5] rounded-xl overflow-hidden bg-primary/10">
              <img
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGDm5jUdty9MtGor82NnllcjHI7U6cy0_c9N2bL3oAhLatHi9_5s7eMgcU_Fe-m3kcpIHsw7piMQa-6EEcZS4t8jXb1qMihksXewkj1vbGE0Y2wi9_Ic6vecYhhqDjvHm9q6lnyvUyU15ZJ9AhmVjnbefuDwLApKptqoHayMU_lXzy952boa4VlDiiIs1ac-LGhK2tvNABw_Q5FjzdaVh3_x6hCmhUY5Fy2-Az9cwjMOAEGZW1m2YxMkuTlfcQi15fgkUcElWAToDR"
                alt="Burgundy lace bodysuit"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-primary/10">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5toeWHoHarnDW9Va-bsYWP1ektt6i7KD-rDlI--Jx906IvCCB4CimPcH1wbBt9uG8inwkmQaAhIe21dW-nlvN3ElcwWNu_eGdyytEiPYegFtX4iX4MEliqwqONdK4CcERbnnyeCC1qSTRf20d0idBKxsWH9GqVJNuiQR9jOCjmw_OBAtXMCkXLkIyP5Qz16pmv11-L83CGbpdAAbbERVd_ve3NTEvycxczRJOXXEhriVjfpmgci1CBSVnW6Bn0jpXkE42N37UBU1B"
                alt="Lace detail"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-primary/10">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbtg2DM4X28s_1MDk3SA1zKaIGyBUn4IcA0Er2oxx0bkJvzi0KXIGUYYA8uIusixbChq1oF9lVd4ONpkjBkyWsmB73UmPDXnCL3ZpoAoHEFhzY2sEMakC8VUQF7gVueeeH3fo1ZeL5hbUj4Dc-q18I9ayy_Q0ZJj0DVE6fRXxINVatHGXvdiTK_Fv_wWPpnwK3pfmB_sfS8BUp5k76g-Asilv9bjKTvZnZgocTezzL6uyxnZueWzHMbNrnd5frM4CbRGlg3LprDSkb"
                alt="Back detail"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="sticky top-28">
              <div className="mb-2">
                <span className="text-accent text-xs font-bold uppercase tracking-widest">Coleção Heritage</span>
              </div>
              <h1 className="text-4xl lg:text-5xl mb-4 text-slate-100 font-serif">Bodysuit de Renda Etéreo</h1>
              <p className="text-2xl text-slate-300 mb-8">R$ 245,00</p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-400">Cor: <span className="text-slate-100">{selectedColor}</span></h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedColor('Borgonha')}
                      className={`w-8 h-8 rounded-full bg-[#3d1f1f] ring-2 ring-offset-2 ring-offset-bg-dark transition-all ${selectedColor === 'Borgonha' ? 'ring-accent' : 'ring-transparent'}`}
                    />
                    <button
                      onClick={() => setSelectedColor('Rosa')}
                      className={`w-8 h-8 rounded-full bg-[#E98B8B] hover:scale-110 transition-all ring-2 ring-offset-2 ring-offset-bg-dark ${selectedColor === 'Rosa' ? 'ring-accent' : 'ring-transparent'}`}
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
                    <div className="pt-4 text-sm leading-relaxed text-slate-400">
                      Criado com maestria em nosso estúdio, o Bodysuit de Renda Etéreo apresenta bordados florais intrincados em tule elástico delicado. Uma celebração da feminilidade moderna, esta peça oferece um ajuste contornado com painéis transparentes e acabamentos em seda.
                    </div>
                  </details>
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <h3 className="text-xs font-bold uppercase tracking-widest">Materiais & Cuidados</h3>
                      <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pt-4 text-sm leading-relaxed text-slate-400">
                      85% Nylon, 15% Elastano. Acabamento: 100% Seda. Lavar apenas à mão com água fria. Não usar secadora. Manusear com carinho.
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Complete the Look */}
        <section className="mt-24 border-t border-primary/20 pt-16">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl mb-2 font-serif">Complete o Look</h2>
              <p className="text-slate-400 text-sm italic">Peças curadas para complementar sua seleção.</p>
            </div>
            <a className="text-xs font-bold uppercase tracking-[0.2em] border-b border-accent pb-1 text-accent" href="#">Ver Coleção</a>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-primary/10 mb-4 relative">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                  />
                  <button className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
                <h4 className="text-sm font-medium mb-1 group-hover:text-accent transition-colors">{item.name}</h4>
                <p className="text-xs text-slate-500">{item.price}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer Copy (simplified for detail page) */}
      <footer className="bg-primary/10 border-t border-primary/20 py-20 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-xl font-bold tracking-tight uppercase mb-6">Bella Sousa</h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Criando elegância atemporal para a mulher moderna. Nossas coleções são projetadas com atenção inigualável aos detalhes e ao conforto.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Atendimento ao Cliente</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a className="hover:text-accent transition-colors" href="#">Envio & Devoluções</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Guia de Tamanhos</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Rastreamento de Pedido</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Fale Conosco</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Explorar</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a className="hover:text-accent transition-colors" href="#">A Boutique</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Nosso Ateliê</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Sustentabilidade</a></li>
              <li><a className="hover:text-accent transition-colors" href="#">Diário</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6">Exclusivo</h4>
            <p className="text-xs text-slate-400 mb-4">Seja a primeira a receber prévias exclusivas e convites para vendas privadas.</p>
            <div className="flex border-b border-accent pb-2">
              <input className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-600" placeholder="Endereço de E-mail" type="email" />
              <ArrowRight className="w-5 h-5 text-accent" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-primary/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">© 2024 Bella Sousa Boutique. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Instagram className="w-5 h-5 text-slate-500 hover:text-accent cursor-pointer" />
            <Share2 className="w-5 h-5 text-slate-500 hover:text-accent cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}
