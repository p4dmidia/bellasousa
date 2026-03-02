import { useState, useMemo, useEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { Filter, Search, X, ChevronDown, SlidersHorizontal, ShoppingBag } from 'lucide-react';

const ALL_PRODUCTS = [
    {
        id: 1,
        name: "Sérum Artesanal",
        category: "Cosméticos",
        price: 45.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_LLBjj65MaK_mDaDfqHd51QWK1MzKShe2GadDLaAaW0KO5W5P8dYluP4woZ7QBttnFtO--OxLnpgW6azLy3w1_evjYhi-OaPnJ-BSVQubmeXG8Mcq1qto9d6mJBdbGjNi10bDyLgZKA2_NFK5t5zs5Xxnm9t5mpQc3pFNgo42nK42AJQ5Bk7hUEOfozcSql0ORtVavqkH9B88BdGDutG4oDXL_XTrFdUMhzylRjHzAezxS8hdKpscZBjep-hxHmlz8ab3oPphgGNX"
    },
    {
        id: 2,
        name: "Robe de Seda Boutique",
        category: "Lingerie",
        price: 320.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrkTZIq1IuwZIpzftZnQaM388t-t1NsOsIUDYzfteKuuMYO5jQRoKoH09JseHmO1qlV7NZxQnXaK28kOH1OeMs7xQ8n9_RGlgycGifvlCm6cWSRcvGY-TjyKBRe2wxZzTSz6ZN4QV8xZSUYX4e-B6PEn-rK0vb7PTJpsr8TGchpMM43GZowG15qv0nErizKz62oPzUlbLbd2RPKCFFbL59ORleBZ6Kex3jHDhawjr6_yIa515dZBsdOUMMUyxnrJkcdOJD6zLWYpEg"
    },
    {
        id: 3,
        name: "Conjunto de Pincéis Premium",
        category: "Acessórios",
        price: 85.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBfJaNjMbpJC1pOikfq5ourHNCvTifM04kyXHA4NIgT-KiESWeRCBIaA9i-zzwbI7SKnBpUKwNurTFPmWc15QRssyLitsR8Ieg0baD3HDnH2hqNrpQsynZ4bSy0oQlaKVklg7jOVrqZBoRJgXy5naJt01Pwnw-GiJebvYa18IDY-Y77lI-TWmgo3cJeXgbR0q3RYEPAp_UmyD6xqOZUODhlOqFyCvoH1hnCfeQP-d-yVe9QsJNh6hTodsFbH_yWZODuy0rHNIcHr5bv"
    },
    {
        id: 4,
        name: "Bodysuit de Renda Midnight",
        category: "Lingerie",
        price: 245.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6FUBoNtrvOHL1z3taG4BHmGnkr35bPhvL62o_MEdFZm94OxCnGqpoOWRH9mImTDk1q5dYRQmFE7A31CSoTYMhmg3nU6yK-UjSoEjIETIMz_6yRcNYxM85HRLh_FmhzZSsqHqaE2Pn2LL8m37eUuyd8FBJaao9Vgx_kQuuatTMDMoUJDtZcg9J9Zk8jxPcIpFKL4vPHYIGFaJo9EWA9TkrDfuWar4lmFJ062QaX-RVVtXEQOUU2gWpJ9_CLciWCMhez8_vzxrm1hCv"
    },
    {
        id: 5,
        name: "Máscara de Renda Chantilly",
        category: "Lingerie",
        price: 85.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6Siwu_Q9LesAP1uYrLc-JrcKdJ0cuNhh5pJGVoRDY57XEyx2w810ZKpZuwQfNyH1tfrPJuUdV8yw4HzaWnURve5A_lOpvfZaUW50XC6u_RXD6-FsOcBpqrRH-NA-a2vu8l43L-Xb5Yl6f2p2qvm45mZHR-HDOhLHnmAgfrlkIrsvD_rNU9Nc5eshQ8clR1yKrOBwrwf4bKq3UcnGyts-AraQxE5b640UxcF0rU0Qosuzgifq2vEcVAcgym7KSM5bXLJ7xqQ2ROKs7"
    },
    {
        id: 6,
        name: "Meias Bordadas",
        category: "Acessórios",
        price: 65.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3ZvILAiOjC2-s1IEzXi7A_x2fXuXJcnCGTcx8Mu9KE26B-NKKJsjThUvCj6TdtkkKNqlhzpf7cjReX9B_vheqi56WvK6yXbEyy2lH_KD53-d_TrLT6lo1ow-BbP_9HiMut4rSaRO7GDf7w5Z6vV6tpD-wwuYh9nz4s33AZn8OqAXuNm5wGYk9s2wRFZ8o74H-2ZoFHuzALKR4Tu-uLZXOXxkdK4jiR_EV3rSTmE9rxq5QleSk7iLt2yWkmyOLNrUTrHpDbUHEZ6sI"
    },
    {
        id: 7,
        name: "Perfume Nocturnal Rose",
        category: "Cosméticos",
        price: 180.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqOPlTnfyKqgJR2cylQo0TovU7oV5av0MRdt2D5Gcn-K3tBTevrVTamwAE-h9j5cHw5XaQidICVDC3uNqvYSN-7TwU3fRJNjdV2MnT_cdF71-WbBH6SrlLerbwWv19o5wA8FOlZGh5j7tWUSSDkvOEPM59Dq5QbMeSnrVynTJgU8OAyID8Q5c9Orn6mtnPqzXQiJz6j7H183QJx_XXvvnowN8vgpbQAE2OsJtiD4OsiPL7t0yzuqF3qCiDD0DZEGmYAl5odu8LAltD"
    },
    {
        id: 8,
        name: "Creme para Mãos Hidratação Intensa",
        category: "Cosméticos",
        price: 35.00,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGDm5jUdty9MtGor82NnllcjHI7U6cy0_c9N2bL3oAhLatHi9_5s7eMgcU_Fe-m3kcpIHsw7piMQa-6EEcZS4t8jXb1qMihksXewkj1vbGE0Y2wi9_Ic6vecYhhqDjvHm9q6lnyvUyU15ZJ9AhmVjnbefuDwLApKptqoHayMU_lXzy952boa4VlDiiIs1ac-LGhK2tvNABw_Q5FjzdaVh3_x6hCmhUY5Fy2-Az9cwjMOAEGZW1m2YxMkuTlfcQi15fgkUcElWAToDR"
    }
];

const CATEGORIES = ["Todos", "Lingerie", "Cosméticos", "Acessórios"];

export default function Store({
    onAddToCart,
    onProductClick,
    initialCategory,
    searchQuery,
    onSearchChange
}: {
    onAddToCart: (product: any) => void,
    onProductClick: () => void,
    initialCategory?: string,
    searchQuery?: string,
    onSearchChange?: (q: string) => void
}) {

    const [search, setSearch] = useState(searchQuery || "");
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || "Todos");
    const [sortBy, setSortBy] = useState("Novidades");
    const [priceRange, setPriceRange] = useState(500);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Sincronizar com a categoria vinda da navegação
    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [initialCategory]);

    // Sincronizar busca vinda do Header
    useEffect(() => {
        if (searchQuery !== undefined) {
            setSearch(searchQuery);
        }
    }, [searchQuery]);


    const filteredProducts = useMemo(() => {
        return ALL_PRODUCTS.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.category.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
            const matchesPrice = product.price <= priceRange;
            return matchesSearch && matchesCategory && matchesPrice;
        }).sort((a, b) => {
            if (sortBy === "Menor Preço") return a.price - b.price;
            if (sortBy === "Maior Preço") return b.price - a.price;
            return 0; // Novidades (ordem padrão do ID por enquanto)
        });
    }, [search, selectedCategory, priceRange, sortBy]);

    return (
        <div className="bg-white pt-12 pb-24">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16">
                {/* Header da Loja */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 border-b border-black/5 pb-12">
                    <div className="text-center md:text-left">
                        <h1 className="text-primary text-5xl font-serif mb-2">Boutique Bella Sousa</h1>
                        <p className="text-slate-600 font-light max-w-lg">Explore nossa curadoria de peças íntimas luxuosas e cosméticos artesanais de alta performance.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="relative group flex-1 min-w-[300px]">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" />
                            <input
                                type="text"
                                placeholder="O que você está procurando?"
                                className="w-full bg-slate-50 border border-slate-200 rounded-full py-4 pl-12 pr-6 text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-slate-400"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    if (onSearchChange) onSearchChange(e.target.value);
                                }}
                            />
                        </div>
                        <button
                            className="lg:hidden flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 px-6 py-4 rounded-full text-primary hover:border-accent/50 transition-all"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <Filter className="w-5 h-5" />
                            <span>Filtros</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar - Filtros */}
                    <aside className={`lg:w-64 space-y-10 lg:block ${isFilterOpen ? 'block' : 'hidden'}`}>
                        <section>
                            <h3 className="text-primary text-xs font-bold uppercase tracking-widest mb-6 border-b border-accent/20 pb-2">Categorias</h3>
                            <ul className="space-y-3">
                                {CATEGORIES.map(cat => (
                                    <li key={cat}>
                                        <button
                                            className={`text-sm tracking-wide transition-all w-full text-left flex items-center justify-between group ${selectedCategory === cat ? 'text-accent font-semibold' : 'text-slate-500 hover:text-primary'}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            {cat}
                                            {selectedCategory === cat && <motion.div layoutId="category-dot" className="w-1.5 h-1.5 bg-accent rounded-full" />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-primary text-xs font-bold uppercase tracking-widest mb-6 border-b border-accent/20 pb-2">Faixa de Preço</h3>
                            <div className="px-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="500"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(Number(e.target.value))}
                                    className="w-full accent-accent h-1 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between mt-4 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                    <span>R$ 0</span>
                                    <span className="text-primary">R$ {priceRange.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-primary text-xs font-bold uppercase tracking-widest mb-6 border-b border-accent/20 pb-2">Ordenar Por</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {["Novidades", "Menor Preço", "Maior Preço"].map(option => (
                                    <button
                                        key={option}
                                        onClick={() => setSortBy(option)}
                                        className={`text-[11px] uppercase tracking-widest py-2 px-4 rounded-md border text-center transition-all ${sortBy === option ? 'bg-accent/10 border-accent/50 text-accent' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <button
                            className="lg:hidden w-full bg-accent text-primary py-4 rounded-xl font-bold uppercase tracking-widest text-xs mt-8"
                            onClick={() => setIsFilterOpen(false)}
                        >
                            Aplicar Filtros
                        </button>
                    </aside>

                    {/* Grid de Produtos */}
                    <main className="flex-1">
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-slate-400 text-xs uppercase tracking-widest">{filteredProducts.length} Produtos Encontrados</span>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {filteredProducts.length > 0 ? (
                                <motion.div
                                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8"
                                    layout
                                >
                                    {filteredProducts.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="group flex flex-col gap-4"
                                        >
                                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-50 cursor-pointer" onClick={onProductClick}>
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="absolute top-4 left-4">
                                                    <span className="bg-white/80 backdrop-blur-md text-primary text-[10px] uppercase font-bold tracking-[0.2em] px-3 py-1.5 rounded-full border border-black/5">
                                                        {product.category}
                                                    </span>
                                                </div>
                                                <button
                                                    className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-primary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-accent hover:text-white flex items-center justify-center gap-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToCart(product);
                                                    }}
                                                >
                                                    Adicionar à Sacola
                                                    <ShoppingBag className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="px-2 text-center">
                                                <h4 className="text-primary text-xl font-serif mb-1 group-hover:text-accent transition-colors">{product.name}</h4>
                                                <p className="text-accent text-sm font-semibold tracking-wider">R$ {product.price.toFixed(2)}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-32 text-center"
                                >
                                    <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-accent/20">
                                        <X className="w-8 h-8 text-accent" />
                                    </div>
                                    <h3 className="text-primary text-2xl font-serif mb-2">Nenhum produto encontrado</h3>
                                    <p className="text-slate-500 max-w-xs">Tente ajustar seus filtros ou pesquisar por outro termo.</p>
                                    <button
                                        className="mt-8 text-accent border-b border-accent/30 hover:border-accent transition-all text-sm uppercase tracking-widest font-bold"
                                        onClick={() => {
                                            setSearch("");
                                            setSelectedCategory("Todos");
                                            setPriceRange(500);
                                        }}
                                    >
                                        Resetar Filtros
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>

    );
}
