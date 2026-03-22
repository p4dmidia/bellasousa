import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, User, MapPin, ArrowLeft, Users } from 'lucide-react';
import { supabase, ORGANIZATION_ID, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { getStoredReferral } from '../lib/referral';

interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    image_url?: string;
    quantity: number;
}

export default function Checkout({
    items,
    onFinish,
    onBackToCart
}: {
    items: CartItem[],
    onFinish: () => void,
    onBackToCart: () => void
}) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [personal, setPersonal] = useState({ name: '', email: '', whatsapp: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [paymentMethod] = useState<'whatsapp'>('whatsapp');
    const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
    
    useEffect(() => {
        const autoFetchAffiliate = async () => {
            const ref = getStoredReferral();
            if (ref) {
                // Keep a lightweight auto-fetch just for the display name
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
                
                // Columns verified: id, email, cpf, login
                let query = supabase.from('user_profiles').select('id, email, cpf, login');
                
                if (isUUID) {
                    query = query.or(`id.eq."${ref}",email.ilike."${ref}",login.eq."${ref}"`);
                } else {
                    // Try email, login or CPF
                    const sanitizedCpf = ref.replace(/\D/g, '');
                    query = query.or(`email.ilike."${ref}",login.eq."${ref}",cpf.eq."${ref}",cpf.eq."${sanitizedCpf}"`);
                }

                const { data, error } = await query
                    .eq('organization_id', ORGANIZATION_ID)
                    .maybeSingle();
                
                if (error) console.error("Checkout: Error finding affiliate:", error);
                
                if (data) {
                    setSelectedAffiliate(data);
                    const displayName = data.email?.split('@')[0] || 'Consultora';
                    console.log("Checkout: Affiliate auto-identified:", displayName);
                }
            }
        };
        autoFetchAffiliate();
    }, []);

    const isFormValid = personal.name && personal.email && personal.whatsapp;

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = 0;
    const total = subtotal + shipping;

    const onSubmitPayment = async () => {
        if (!isFormValid) {
            toast.error("Por favor, preencha seus dados.");
            return;
        }

        setIsProcessing(true);
        
        const referralCode = getStoredReferral();

        try {
            const response = await fetch(`${supabaseUrl}/functions/v1/process-payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseAnonKey,
                    "Authorization": `Bearer ${supabaseAnonKey}`
                },
                body: JSON.stringify({
                    items: items,
                    total_amount: total,
                    user_info: personal,
                    organization_id: ORGANIZATION_ID,
                    affiliate_id: selectedAffiliate?.id, // Pass ID if already resolved by frontend
                    referral_code: referralCode,         // Pass raw code as fallback for server-side resolution
                    payment_method_id: paymentMethod
                }),
            });

            const data = await response.json();
            setIsProcessing(false);

            if (data.success || data.id) {
                const orderData = data.order || data;
                setPaymentResult(orderData);
                setStep('success');
                
                // WhatsApp Redirection
                const orderId = orderData.payment_id || orderData.id;
                const itemsList = items.map(i => `- ${i.quantity}x ${i.name} (R$ ${i.price.toFixed(2)})`).join('\n');
                const message = `Olá! Acabei de fazer um pedido no site Bella Sousa:
📦 *Pedido:* #${orderId}
👤 *Cliente:* ${personal.name}
📱 *WhatsApp:* ${personal.whatsapp}
🛍️ *Produtos:*
${itemsList}
💰 *Total:* R$ ${total.toFixed(2)}
🤝 *Indicação:* ${selectedAffiliate?.email?.split('@')[0] || 'Automática'}

*Aguardo instruções para pagamento!*`;

                const waUrl = `https://wa.me/5574999527824?text=${encodeURIComponent(message)}`;
                setTimeout(() => {
                    window.open(waUrl, '_blank');
                }, 1500);
            } else {
                toast.error("Falha ao registrar pedido: " + (data.error || data.message));
            }
        } catch (error) {
            setIsProcessing(false);
            console.error(error);
            toast.error("Erro ao comunicar com o servidor.");
        }
    };

    if (step === 'success') {
        const orderId = paymentResult?.payment_id || '---';

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 bg-white flex flex-col items-center justify-center py-20 px-6"
            >
                <div className="flex flex-col items-center w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <div className="size-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-primary text-3xl font-serif mb-4 text-center">Pedido Enviado!</h2>
                    <p className="text-slate-500 mb-2 text-center text-sm">Seu pedido foi registrado. Estamos te redirecionando para o WhatsApp para combinar o pagamento.</p>
                    <p className="text-slate-400 text-xs mb-10 text-center font-bold uppercase tracking-widest">Código do Pedido: #{orderId}</p>

                    <button
                        onClick={() => {
                            const itemsList = items.map(i => `- ${i.quantity}x ${i.name} (R$ ${i.price.toFixed(2)})`).join('\n');
                            const message = `Olá! Acabei de fazer um pedido no site Bella Sousa:\n📦 *Pedido:* #${orderId}\n👤 *Cliente:* ${personal.name}\n📱 *WhatsApp:* ${personal.whatsapp}\n🛍️ *Produtos:*\n${itemsList}\n💰 *Total:* R$ ${total.toFixed(2)}\n🤝 *Indicação:* ${selectedAffiliate?.email?.split('@')[0] || 'Automática'}\n\n*Aguardo instruções para pagamento!*`;
                            window.open(`https://wa.me/5574999527824?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="btn-primary w-full py-4 mb-4 flex items-center justify-center gap-2"
                    >
                        Abrir WhatsApp Novamente
                    </button>

                    <button
                        onClick={onFinish}
                        className="text-slate-400 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                        Voltar para a Loja
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex-1 bg-slate-50 py-10 lg:py-20 px-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <button onClick={onBackToCart} className="text-slate-400 hover:text-primary transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-primary text-4xl font-serif">Finalizar Pedido</h1>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-8">
                            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="size-10 bg-accent/10 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 className="text-primary text-xl font-serif">Dados Pessoais</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Nome Completo</label>
                                        <input required type="text" placeholder="Ex: Maria Silva" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all text-black" 
                                            value={personal.name} onChange={e => setPersonal({...personal, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">E-mail</label>
                                        <input required type="email" placeholder="maria@exemplo.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all text-black" 
                                            value={personal.email} onChange={e => setPersonal({...personal, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">WhatsApp</label>
                                        <input required type="tel" placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all text-black" 
                                            value={personal.whatsapp} onChange={e => setPersonal({...personal, whatsapp: e.target.value})} />
                                    </div>
                                </div>
                            </section>

                            {selectedAffiliate && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 bg-green-500/10 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest leading-tight">Consultora Identificada</p>
                                            <p className="text-xs text-primary font-bold">{selectedAffiliate.email?.split('@')[0] || 'Consultora'}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <button 
                                onClick={onSubmitPayment}
                                disabled={!isFormValid || isProcessing}
                                className="w-full btn-primary py-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? 'Processando...' : 'Finalizar Pedido no WhatsApp'}
                            </button>
                        </div>
                    </motion.div>

                    <aside>
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xl sticky top-32">
                            <h2 className="text-primary text-xl font-serif mb-8 border-b border-slate-50 pb-4">Resumo da Compra</h2>

                            <div className="max-h-64 overflow-y-auto mb-8 pr-2 space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="size-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                            <img src={item.image || item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-primary text-sm font-serif line-clamp-1">{item.name}</h4>
                                            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Qtd: {item.quantity}</p>
                                        </div>
                                        <p className="text-primary text-sm font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 mb-4 pt-4 border-t border-slate-50">
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Subtotal</span>
                                    <span>R$ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Retirada na Loja</span>
                                    <span>Grátis</span>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex justify-between text-primary font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-accent">R$ {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 border border-slate-100">
                                <MapPin className="w-4 h-4 text-accent" />
                                <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">Retirada na Loja Bella Sousa</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
