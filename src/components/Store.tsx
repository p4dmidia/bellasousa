import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Search, X, ShoppingBag } from 'lucide-react';
import { supabase, ORGANIZATION_ID } from '../lib/supabase';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    image_url: string;
    category_id: number;
}

const CATEGORIES = ["Todos", "Lingerie", "Cosméticos", "Casa", "Acessórios"];

export default function Store({
    onAddToCart,
    onProductClick,
    initialCategory,
    searchQuery,
    onSearchChange
}: {
    onAddToCart: (product: any) => void,
    onProductClick: (product: any) => void,
    initialCategory?: string,
    searchQuery?: string,
    onSearchChange?: (q: string) => void
}) {

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchQuery || "");
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || "Todos");
    const [sortBy, setSortBy] = useState("Novidades");
    const [priceRange, setPriceRange] = useState(500);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID)
                .eq('is_active', true);

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data || []);
            }
            setLoading(false);
        };

        fetchProducts();
    }, []);

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
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(search.toLowerCase()));
            
            // Map category_id to name for filtering if needed, or just use category names if they match
            // For now, keeping it simple as we don't have a category name in products table yet
            const matchesCategory = selectedCategory === "Todos"; // || product.category === selectedCategory;
            const matchesPrice = product.price <= priceRange;
            return matchesSearch && matchesCategory && matchesPrice;
        }).sort((a, b) => {
            if (sortBy === "Menor Preço") return a.price - b.price;
            if (sortBy === "Maior Preço") return b.price - a.price;
            return 0; // Novidades (ordem padrão do ID por enquanto)
        });
    }, [products, search, selectedCategory, priceRange, sortBy]);

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
                    <main className="flex-1 p-5">
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
                                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-50 cursor-pointer" onClick={() => onProductClick(product)}>
                                                <img
                                                    src={product.image_url || product.image}
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
