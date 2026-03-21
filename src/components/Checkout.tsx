import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, CreditCard, User, MapPin, ArrowRight, ArrowLeft, Banknote, Users, Search, ChevronDown } from 'lucide-react';
import { supabase, ORGANIZATION_ID, supabaseUrl } from '../lib/supabase';

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
    const [paymentMethod, setPaymentMethod] = useState<'manual_pix' | 'manual_card' | 'manual_cash'>('manual_pix');
    const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    
    // Combobox state
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchAffiliates = async () => {
            const { data } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('organization_id', ORGANIZATION_ID);
            
            if (data) {
                // Map the data to normalize raw_user_meta_data if present
                const normalized = data.map((u: any) => ({
                    ...u,
                    full_name: u.full_name || u.raw_user_meta_data?.full_name || '',
                    login: u.login || u.raw_user_meta_data?.login || '',
                    cpf: u.cpf || u.raw_user_meta_data?.cpf || ''
                }));
                // Filter only those who are actually affiliates (optional: check role if you have one, or just show all for now)
                setAffiliates(normalized);
            }
        };
        fetchAffiliates();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isFormValid = personal.name && personal.email && personal.whatsapp && selectedAffiliate;

    const filteredAffiliates = affiliates.filter(aff => {
        const search = searchTerm.toLowerCase();
        const fullName = String(aff.full_name || '').toLowerCase();
        const email = String(aff.email || '').toLowerCase();
        const login = String(aff.login || '').toLowerCase();
        const cpf = String(aff.cpf || '').toLowerCase();
        const id = String(aff.id || '').toLowerCase();
        
        return (
            fullName.includes(search) ||
            email.includes(search) ||
            login.includes(search) ||
            cpf.includes(search) ||
            id.includes(search)
        );
    });

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = 0;
    const total = subtotal + shipping;

    const onSubmitPayment = async () => {
        if (!isFormValid) {
            toast.error("Por favor, preencha seus dados.");
            return;
        }

        setIsProcessing(true);
        
        fetch(`${supabaseUrl}/functions/v1/process-payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                payment_data: { payment_method_id: paymentMethod },
                items: items,
                total_amount: total,
                user_info: personal,
                organization_id: ORGANIZATION_ID,
                affiliate_id: selectedAffiliate?.id
            }),
        })
        .then((res) => res.json())
        .then((response) => {
            setIsProcessing(false);
            if (response.status === 'approved' || response.status === 'pending' || response.status === 'in_process' || response.id) {
                 setPaymentResult(response);
                 setStep('success');
            } else {
                 console.error("API Error Response:", response);
                 toast.error("Falha ao registrar venda: " + (response.error || response.message || response.status));
            }
        })
        .catch((error) => {
            setIsProcessing(false);
            console.error(error);
            toast.error("Erro ao comunicar com o servidor.");
        });
    };

    if (step === 'success') {
        const orderId = paymentResult?.id?.toString().replace('pos_', '') || Math.floor(Math.random() * 90000) + 10000;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 bg-white flex flex-col items-center justify-center py-20 px-6 overflow-y-auto"
            >
                <div className="flex flex-col items-center w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <div className="size-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-primary text-3xl font-serif mb-4 text-center">Venda Registrada!</h2>
                    <p className="text-slate-500 mb-2 text-center text-sm">O pedido foi lançado com sucesso no sistema e a comissão foi calculada.</p>
                    <p className="text-slate-400 text-xs mb-10 text-center font-bold uppercase tracking-widest">Pedido Interno: #BS-{orderId}</p>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full mb-8">
                        <p className="text-primary text-center text-sm leading-relaxed italic">As integrações da Frente de Caixa atualizarão os painéis dos afiliados em instantes.</p>
                    </div>

                    <button
                        onClick={onFinish}
                        className="btn-primary px-12"
                    >
                        Nova Venda
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
                    {/* Formulário */}
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

                            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="size-10 bg-accent/10 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 className="text-primary text-xl font-serif">Atribuição de Venda</h2>
                                </div>
                                
                                <div className="space-y-4 mb-8 relative" ref={dropdownRef}>
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Vendedor / Afiliado Obrigatório</label>
                                    
                                    {selectedAffiliate ? (
                                        <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-primary font-bold">{selectedAffiliate.full_name || selectedAffiliate.login || 'Usuário'}</span>
                                                <span className="text-xs text-slate-500">{selectedAffiliate.email} {selectedAffiliate.cpf ? `• CPF: ${selectedAffiliate.cpf}` : ''}</span>
                                                <span className="text-[10px] text-slate-400 font-mono mt-1">ID: {selectedAffiliate.id}</span>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedAffiliate(null)}
                                                className="text-xs text-red-500 font-bold hover:underline px-2 py-1"
                                            >
                                                Trocar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="relative flex items-center">
                                                <div className="absolute left-4 text-slate-400">
                                                    <Search className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Pesquisar por nome, email, id, usuário, cpf..."
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 pl-12 pr-12 focus:outline-none focus:border-accent/40 transition-all text-black"
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        setIsDropdownOpen(true);
                                                    }}
                                                    onClick={() => setIsDropdownOpen(true)}
                                                />
                                                <div className="absolute right-4 text-slate-400 cursor-pointer pointer-events-none">
                                                    <ChevronDown className="w-5 h-5" />
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isDropdownOpen && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
                                                    >
                                                        {filteredAffiliates.length > 0 ? (
                                                            <div className="p-2 space-y-1">
                                                                {filteredAffiliates.map(aff => (
                                                                    <div 
                                                                        key={aff.id}
                                                                        onClick={() => {
                                                                            setSelectedAffiliate(aff);
                                                                            setIsDropdownOpen(false);
                                                                            setSearchTerm('');
                                                                        }}
                                                                        className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                                                    >
                                                                        <p className="font-bold text-slate-700">{aff.full_name || aff.login || 'Usuário Sem Nome'}</p>
                                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                            <span>{aff.email}</span>
                                                                            {aff.cpf && <span>• {aff.cpf}</span>}
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-400 font-mono mt-1 break-all">ID: {aff.id}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="p-6 text-center text-slate-400 text-sm">
                                                                Nenhum afiliado encontrado.
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>

                                <hr className="border-slate-100 mb-8" />

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="size-10 bg-accent/10 rounded-full flex items-center justify-center">
                                        <Banknote className="w-5 h-5 text-accent" />
                                    </div>
                                    <h2 className="text-primary text-xl font-serif">Forma de Pagamento Captada</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    <button 
                                        onClick={() => setPaymentMethod('manual_pix')}
                                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all ${paymentMethod === 'manual_pix' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-100/50 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">PIX</span>
                                    </button>
                                    <button 
                                        onClick={() => setPaymentMethod('manual_card')}
                                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all ${paymentMethod === 'manual_card' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">Cartão</span>
                                    </button>
                                    <button 
                                        onClick={() => setPaymentMethod('manual_cash')}
                                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all ${paymentMethod === 'manual_cash' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-amber-100/50 flex items-center justify-center">
                                            <Banknote className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">Dinheiro</span>
                                    </button>
                                </div>

                                <button 
                                    onClick={onSubmitPayment}
                                    disabled={!isFormValid || isProcessing}
                                    className="w-full btn-primary py-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? 'Lançando...' : 'Lançar Pedido e Calcular Comissão'}
                                </button>
                            </section>
                        </div>
                    </motion.div>

                    {/* Resumo Lateral */}
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
