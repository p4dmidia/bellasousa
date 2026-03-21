import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, UserPlus, HelpCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export function Login({ onBack, onSwitchToRegister, onLoginSuccess }: { onBack: () => void, onSwitchToRegister: () => void, onLoginSuccess: () => void }) {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        let loginEmail = identifier;

        // If identifier is not an email (no @), look it up in user_profiles
        if (!identifier.includes('@')) {
            // Sanitize CPF if it looks like one (numeric only)
            const sanitized = identifier.replace(/\D/g, '');
            
            // Query user_profiles for cpf OR login
            // We use .or() to search in multiple columns
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('email')
                .or(`cpf.eq.${identifier},login.eq.${identifier},cpf.eq.${sanitized}`)
                .maybeSingle();

            if (profileError) {
                toast.error("Erro ao verificar identificador: " + profileError.message);
                setLoading(false);
                return;
            }

            if (profile?.email) {
                loginEmail = profile.email;
            } else {
                toast.error("Usuário não encontrado.");
                setLoading(false);
                return;
            }
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password
        });

        if (error) {
            toast.error("Erro ao entrar: " + error.message);
        } else {
            onLoginSuccess();
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 bg-white flex flex-col items-center justify-center py-20 px-6 min-h-[80vh]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white p-10 rounded-[40px] border border-black/5 shadow-2xl relative overflow-hidden">
                    {/* Elementos Decorativos de Fundo */}
                    <div className="absolute top-0 right-0 size-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                    <div className="text-center mb-10 relative z-10">
                        <h2 className="text-primary text-3xl font-serif mb-3">Bem-vinda de Volta</h2>
                        <p className="text-slate-500 font-light text-sm">Acesse seu Escritório Virtual Bella Sousa</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">E-mail, Usuário ou CPF</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    required
                                    type="text"
                                    placeholder="email@exemplo.com ou CPF"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 pl-12 focus:outline-none focus:border-accent/40 transition-all font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Senha</label>
                                <button type="button" className="text-[10px] uppercase tracking-widest font-bold text-accent hover:text-primary transition-colors">Esqueci a senha</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 pl-12 pr-12 focus:outline-none focus:border-accent/40 transition-all font-medium text-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-accent transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/95 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-primary/20 group disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar no Painel"}
                            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-50 text-center relative z-10">
                        <p className="text-slate-400 text-sm font-light mb-4">Ainda não é uma consultora Bella Sousa?</p>
                        <button
                            onClick={onSwitchToRegister}
                            className="flex items-center justify-center gap-2 mx-auto text-accent hover:text-primary transition-colors text-[10px] uppercase tracking-[0.2em] font-bold"
                        >
                            <UserPlus className="w-4 h-4" />
                            Quero me Cadastrar agora
                        </button>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Suporte</span>
                    </div>
                    <button onClick={onBack} className="text-[10px] uppercase tracking-widest font-bold hover:text-accent transition-colors">Voltar para a Loja</button>
                </div>
            </motion.div>
        </div>
    );
}
