import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, CreditCard, Truck, User, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { ORGANIZATION_ID } from '../lib/supabase';

const mpKey = (import.meta as any).env.VITE_MERCADO_PAGO_PUBLIC_KEY;
if (mpKey) {
    initMercadoPago(mpKey, { locale: 'pt-BR' });
}

interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
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
    const [personal, setPersonal] = useState({ name: '', email: '', cpf: '', whatsapp: '' });
    const [address, setAddress] = useState({ street: '', cep: '', city: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 300 ? 0 : 25;
    const total = subtotal + shipping;

    const onSubmitPayment = async ({ selectedPaymentMethod, formData }: any) => {
        return new Promise<void>((resolve, reject) => {
            setIsProcessing(true);
            
            // Allow bypassing MP if fields are empty during dev, or handle validations
            if(!personal.email) {
                alert("Por favor, preencha seu e-mail nos dados pessoais.");
                setIsProcessing(false);
                reject();
                return;
            }

            fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    payment_data: formData,
                    items: items,
                    total_amount: total,
                    user_info: personal,
                    organization_id: ORGANIZATION_ID,
                    affiliate_id: localStorage.getItem('affiliate_referrer') || undefined
                }),
            })
            .then((res) => res.json())
            .then((response) => {
                setIsProcessing(false);
                if (response.status === 'approved' || response.status === 'pending' || response.status === 'in_process' || response.id) {
                     setStep('success');
                     resolve();
                } else {
                     alert("Falha no pagamento: " + (response.message || response.status));
                     reject();
                }
            })
            .catch((error) => {
                setIsProcessing(false);
                console.error(error);
                alert("Erro ao comunicar com o servidor de pagamento.");
                reject();
            });
        });
    };

    if (step === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 bg-white flex flex-col items-center justify-center py-32 px-6"
            >
                <div className="size-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-primary text-4xl font-serif mb-4 text-center">Pedido Confirmado!</h2>
                <p className="text-slate-500 mb-2 text-center">Obrigado por escolher a Bella Sousa.</p>
                <p className="text-slate-400 text-sm mb-10 text-center font-bold uppercase tracking-widest">Número do Pedido: #BS-{Math.floor(Math.random() * 90000) + 10000}</p>

                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 w-full max-w-md mb-12">
                    <p className="text-primary text-center text-sm leading-relaxed italic">"Enviamos um e-mail com todos os detalhes e o código de rastreio será enviado assim que seu pedido for despachado."</p>
                </div>

                <button
                    onClick={onFinish}
                    className="btn-primary px-12"
                >
                    Voltar para a Loja
                </button>
            </motion.div>
        );
    }

    return (
        <div className="flex-1 bg-slate-50 py-20 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <button onClick={onBackToCart} className="text-slate-400 hover:text-primary transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-primary text-4xl font-serif">Finalizar Pedido</h1>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Formulário */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-8">
                            <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="size-10 bg-accent/10 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 className="text-primary text-xl font-serif">Dados Pessoais</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Nome Completo</label>
                                        <input required type="text" placeholder="Ex: Maria Silva" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all" 
                                            value={personal.name} onChange={e => setPersonal({...personal, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">E-mail</label>
                                        <input required type="email" placeholder="maria@exemplo.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all" 
                                            value={personal.email} onChange={e => setPersonal({...personal, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">CPF</label>
                                        <input required type="text" placeholder="000.000.000-00" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all" 
                                            value={personal.cpf} onChange={e => setPersonal({...personal, cpf: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">WhatsApp</label>
                                        <input required type="tel" placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all" 
                                            value={personal.whatsapp} onChange={e => setPersonal({...personal, whatsapp: e.target.value})} />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="size-10 bg-accent/10 rounded-full flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 className="text-primary text-xl font-serif">Endereço de Entrega</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Endereço</label>
                                        <input required type="text" placeholder="Rua, número, complemento" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all" 
                                            value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">CEP</label>
                                        <input required type="text" placeholder="00000-000" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all" 
                                            value={address.cep} onChange={e => setAddress({...address, cep: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Cidade / UF</label>
                                        <input required type="text" placeholder="Sua cidade - UF" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all" 
                                            value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="size-10 bg-accent/10 rounded-full flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 className="text-primary text-xl font-serif">Pagamento Seguro</h2>
                                </div>
                                
                                <div className="min-h-[400px]">
                                    {mpKey ? (
                                        <Payment
                                            initialization={{
                                                amount: total,
                                            }}
                                            customization={{
                                                paymentMethods: {
                                                    creditCard: 'all',
                                                    debitCard: 'all',
                                                    ticket: 'all',
                                                    bankTransfer: 'all',
                                                    mercadoPago: 'all',
                                                },
                                            }}
                                            onSubmit={onSubmitPayment}
                                        />
                                    ) : (
                                        <div className="text-center p-8 bg-red-50 text-red-500 rounded-xl">
                                            Chave do Mercado Pago não configurada no ambiente.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </motion.div>

                    {/* Resumo Lateral */}
                    <aside>
                        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-xl sticky top-32">
                            <h2 className="text-primary text-xl font-serif mb-8 border-b border-slate-50 pb-4">Resumo da Compra</h2>

                            <div className="max-h-64 overflow-y-auto mb-8 pr-2 space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="size-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                                    <span>Entrega</span>
                                    <span>{shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex justify-between text-primary font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-accent">R$ {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 border border-slate-100">
                                <Truck className="w-4 h-4 text-accent" />
                                <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">Entrega Internacional Segura</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
