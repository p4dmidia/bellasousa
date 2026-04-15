import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Users, TrendingUp, Award, CheckCircle2, ArrowRight, DollarSign, Zap, Loader2 } from 'lucide-react';
import { supabase, ORGANIZATION_ID } from '../lib/supabase';
import { getStoredReferral, captureReferral } from '../lib/referral';

export function Affiliate({ onBack, onSuccess, onLoginSuccess }: { onBack: () => void, onSuccess: () => void, onLoginSuccess: (session: any) => void }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        whatsapp: '',
        email: '',
        city: '',
        password: '',
        pixKey: ''
    });
    const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
    const [isAffiliateLoading, setIsAffiliateLoading] = useState(true);

    useEffect(() => {
        const fetchReferrer = async () => {
            // Ensure any referral in URL is captured before we try to read from storage
            captureReferral();
            
            const ref = getStoredReferral();
            if (ref) {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
                
                // Primeiro tenta a busca rápida com o filtro de organização
                let query = supabase.from('user_profiles').select('id, email, login');
                
                if (isUUID) {
                    query = query.or(`id.eq.${ref},email.ilike.${ref},login.ilike.${ref}`);
                } else {
                    const sanitizedCpf = ref.replace(/\D/g, '');
                    query = query.or(`email.ilike.${ref},login.ilike.${ref},cpf.eq.${ref},cpf.eq.${sanitizedCpf}`);
                }

                const { data, error } = await query
                    .eq('organization_id', ORGANIZATION_ID)
                    .maybeSingle();
                
                if (!error && data) {
                    setSelectedAffiliate(data);
                    console.log("Affiliate identified (standard):", data.login);
                } else {
                    // SEGUNDA TENTATIVA: Sem o filtro de organização (para casos de base de dados inconsistente)
                    console.log("Affiliate not found with org filter, trying global search for:", ref);
                    let globalQuery = supabase.from('user_profiles').select('id, email, login');
                    if (isUUID) {
                        globalQuery = globalQuery.or(`id.eq.${ref},email.ilike.${ref},login.ilike.${ref}`);
                    } else {
                        const sanitizedCpf = ref.replace(/\D/g, '');
                        globalQuery = globalQuery.or(`email.ilike.${ref},login.ilike.${ref},cpf.eq.${ref},cpf.eq.${sanitizedCpf}`);
                    }
                    
                    const { data: globalData } = await globalQuery.maybeSingle();
                    if (globalData) {
                        setSelectedAffiliate(globalData);
                        console.log("Affiliate identified (global fallback):", globalData.login);
                    } else {
                        console.error("Affiliate NOT FOUND even in global search:", ref);
                    }
                }
            }
            setIsAffiliateLoading(false);
        };
        fetchReferrer();
    }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        // Identificar o indicador (Pode ser o ID fixo ou o código bruto do link para o banco resolver)
        const referrerId = selectedAffiliate?.id || getStoredReferral();

        console.log("Affiliate Signup: Referrer identified:", referrerId);

        const [nome, ...sobrenomeParts] = formData.fullName.split(' ');
        const sobrenome = sobrenomeParts.join(' ');

        // Gerar um login base (parte do email) e adicionar um sufixo aleatório para evitar colisões
        const emailPrefix = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const uniqueLogin = `${emailPrefix}_${Math.random().toString(36).substring(2, 6)}`;

        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    nome,
                    sobrenome,
                    full_name: formData.fullName,
                    whatsapp: formData.whatsapp,
                    city: formData.city,
                    pix_key: formData.pixKey,
                    login: uniqueLogin,
                    organization_id: selectedAffiliate?.organization_id || ORGANIZATION_ID,
                    referrer_id: referrerId
                }
            }
        });


        console.log("Affiliate Signup Response:", { success: !!data.user, error });

        if (error) {
            if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
                toast.error("Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.");
            } else {
                toast.error("Erro ao cadastrar: " + error.message);
            }
        } else {
            if (data.session) {
                // Auto-login successful (e.g. email confirmation disabled)
                onLoginSuccess(data.session);
            } else {
                // Redirect to login as requested
                onSuccess();
            }
        }
        setLoading(false);
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="relative py-24 px-6 md:px-20 bg-primary overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-accent text-xs font-bold uppercase tracking-[0.4em] mb-6 block"
                    >
                        Oportunidade de Negócios Bella Sousa
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-5xl md:text-7xl font-serif mb-8 leading-tight"
                    >
                        Transforme sua Paixão em um <br />
                        <span className="italic text-accent">Império de Beleza</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-300 text-lg md:text-xl font-light mb-12 max-w-3xl mx-auto leading-relaxed"
                    >
                        Junte-se à nossa rede exclusiva de consultoras e descubra como o modelo de Marketing Multinível da Bella Sousa pode proporcionar sua independência financeira com produtos que as mulheres amam.
                    </motion.p>
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => document.getElementById('register-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="btn-primary px-10 py-5 group"
                    >
                        Quero Começar Agora
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>
            </section>

            {/* Benefícios */}
            <section className="py-24 px-6 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-primary text-3xl md:text-5xl font-serif mb-4">Por que ser uma parceira?</h2>
                        <div className="h-1 w-20 bg-accent mx-auto" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <DollarSign className="w-8 h-8" />,
                                title: "Lucratividade Alta",
                                desc: "Margens de lucro imbatíveis tanto na revenda direta de lingeries de luxo quanto em nossa linha de cosméticos artesanais."
                            },
                            {
                                icon: <Users className="w-8 h-8" />,
                                title: "Sistema MMN Real",
                                desc: "Não apenas venda, construa equipe. Ganhe comissões sobre as vendas de toda a sua rede de consultoras parceiras."
                            },
                            {
                                icon: <Zap className="w-8 h-8" />,
                                title: "Treinamento VIP",
                                desc: "Acesso a mentorias exclusivas sobre vendas, marketing digital e liderança para alavancar seu negócio."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-slate-50 p-10 rounded-3xl border border-slate-100 flex flex-col items-center text-center group"
                            >
                                <div className="size-16 bg-white rounded-2xl flex items-center justify-center text-accent shadow-sm mb-8 group-hover:bg-accent group-hover:text-white transition-all duration-500">
                                    {item.icon}
                                </div>
                                <h3 className="text-primary text-2xl font-serif mb-4">{item.title}</h3>
                                <p className="text-slate-500 font-light leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Como Funciona o MMN */}
            <section className="py-24 px-6 md:px-20 bg-slate-50">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-accent text-[10px] uppercase font-bold tracking-widest mb-4 block">Cresça com a gente</span>
                        <h2 className="text-primary text-4xl md:text-5xl font-serif mb-8 leading-tight">Um modelo de negócio desenhado para sua <span className="italic">liberdade</span>.</h2>
                        <p className="text-slate-600 mb-8 leading-relaxed font-light text-lg">
                            Diferente do varejo tradicional, na Bella Sousa você é recompensada por inspirar outras mulheres. Nosso plano de carreira permite que você escale seus ganhos de forma exponencial.
                        </p>

                        <ul className="space-y-6">
                            {[
                                "Bônus de indicação direta e indireta.",
                                "Premiações por metas de volume de equipe.",
                                "Viagens e eventos exclusivos para líderes.",
                                "Suporte 24h via WhatsApp para dúvidas."
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-4 text-primary font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-accent" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative">
                        <div className="aspect-square bg-white rounded-[40px] shadow-2xl p-12 flex flex-col justify-center relative z-10 overflow-hidden">
                            <div className="absolute top-0 right-0 size-40 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <TrendingUp className="w-16 h-16 text-accent mb-8" />
                            <h3 className="text-primary text-3xl font-serif mb-6">Plano de Carreira</h3>
                            <div className="space-y-4">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} whileInView={{ width: '40%' }} className="h-full bg-accent" />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    <span>Consultora</span>
                                    <span>40% Lucro</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} whileInView={{ width: '70%' }} className="h-full bg-accent" />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    <span>Líder de Equipe</span>
                                    <span>Ganhos em Rede</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} className="h-full bg-accent" />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    <span>Diretora / Diamante</span>
                                    <span>Royalties Totais</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -left-8 size-48 bg-primary rounded-3xl -z-0 rotate-12" />
                    </div>
                </div>
            </section>

            {/* Formulário de Cadastro */}
            <section id="register-form" className="py-24 px-6 md:px-20">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white p-12 rounded-[40px] border border-black/5 shadow-2xl relative">
                        <div className="text-center mb-12">
                            <Award className="w-12 h-12 text-accent mx-auto mb-6" />
                            <h2 className="text-primary text-3xl md:text-4xl font-serif mb-4">Faça Parte da Elite</h2>
                            <p className="text-slate-500 font-light">Crie sua conta agora para acessar seu Escritório Virtual Bella Sousa.</p>
                        </div>

                        {selectedAffiliate && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex items-center justify-between mb-8"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-8 bg-green-500/10 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest leading-tight">Consultora Identificada</p>
                                        <p className="text-xs text-primary font-bold">{selectedAffiliate.login || selectedAffiliate.email?.split('@')[0] || 'Consultora'}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Nome Completo</label>
                                    <input required type="text" placeholder="Maria Silva" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all font-light text-black" 
                                        value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">WhatsApp</label>
                                    <input required type="tel" placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all font-light text-black" 
                                        value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">E-mail</label>
                                    <input required type="email" placeholder="maria@exemplo.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all font-light text-black" 
                                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Cidade / UF</label>
                                    <input required type="text" placeholder="São Paulo - SP" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all font-light text-black" 
                                        value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Senha de Acesso</label>
                                <input required type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all font-light text-black" 
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Chave PIX (Para recebimento de comissões)</label>
                                <input required type="text" placeholder="CPF, E-mail ou Telefone" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:outline-none focus:border-accent/40 transition-all font-light text-black" 
                                    value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} />
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/95 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Minha Conta"}
                                {!loading && <CheckCircle2 className="w-5 h-5" />}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
