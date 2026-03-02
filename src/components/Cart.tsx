import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';

interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    category: string;
}

export default function Cart({
    items,
    onUpdateQuantity,
    onRemove,
    onBackToStore,
    onProceedToCheckout
}: {
    items: CartItem[],
    onUpdateQuantity: (id: number, delta: number) => void,
    onRemove: (id: number) => void,
    onBackToStore: () => void,
    onProceedToCheckout: () => void
}) {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 300 ? 0 : 25;
    const total = subtotal + shipping;

    if (items.length === 0) {
        return (
            <div className="flex-1 bg-white flex flex-col items-center justify-center py-32 px-6">
                <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-accent/20">
                    <ShoppingBag className="w-10 h-10 text-accent" />
                </div>
                <h2 className="text-primary text-3xl font-serif mb-4">Sua Sacola está vazia</h2>
                <p className="text-slate-500 mb-10 max-w-xs text-center">Parece que você ainda não escolheu nada especial. Explore nossa boutique e encontre algo único.</p>
                <button
                    onClick={onBackToStore}
                    className="btn-primary px-12"
                >
                    Explorar Boutique
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-slate-50 py-20 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <button onClick={onBackToStore} className="text-slate-400 hover:text-primary transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-primary text-4xl font-serif">Minha Sacola</h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Lista de Itens */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence mode="popLayout">
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white p-6 rounded-2xl border border-black/5 flex gap-6 items-center shadow-sm"
                                >
                                    <div className="size-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">{item.category}</p>
                                        <h3 className="text-primary text-xl font-serif mb-2">{item.name}</h3>
                                        <p className="text-accent font-bold">R$ {item.price.toFixed(2)}</p>
                                    </div>

                                    <div className="flex items-center gap-4 bg-slate-50 rounded-full px-4 py-2 border border-slate-100">
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, -1)}
                                            className="text-slate-400 hover:text-accent p-1 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-primary font-bold min-w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, 1)}
                                            className="text-slate-400 hover:text-accent p-1 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => onRemove(item.id)}
                                        className="text-slate-300 hover:text-red-400 p-2 transition-colors ml-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Resumo */}
                    <aside>
                        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-xl sticky top-32">
                            <h2 className="text-primary text-xl font-serif mb-8 border-b border-slate-50 pb-4">Resumo do Pedido</h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span>R$ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Entrega</span>
                                    <span>{shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex justify-between text-primary font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-accent">R$ {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={onProceedToCheckout}
                                className="w-full bg-primary hover:bg-primary/95 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-primary/20"
                            >
                                Finalizar Compra
                                <ArrowRight className="w-5 h-5" />
                            </button>

                            <p className="text-[10px] text-slate-400 text-center mt-6 uppercase tracking-widest font-medium">Compra 100% Segura & Encriptada</p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
