import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, ShieldCheck, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase, ORGANIZATION_ID } from '../lib/supabase';

interface AdminLoginProps {
    onBack: () => void;
    onLoginSuccess: () => void;
}

export function AdminLogin({ onBack, onLoginSuccess }: AdminLoginProps) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // Verify if user is admin - simplified query to avoid 406
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*') // Select all to see what we get
                    .eq('id', authData.user.id)
                    .maybeSingle();

                console.log("AdminLogin: Profile check results:", { profile, profileError });

                if (profileError || !profile || profile.role !== 'admin') {
                    // Fallback check: if it's the specific admin email and we can't find the profile yet
                    // we might want to check the user metadata as a last resort or just fail gracefully.
                    if (email === 'admin@bellasousa.com.br' && !profileError) {
                         // If profile exists but role is wrong
                         if (profile && profile.role !== 'admin') {
                            await supabase.auth.signOut();
                            toast.error("Este usuário existe mas tem o cargo '" + profile.role + "' e não 'admin'.");
                            setLoading(false);
                            return;
                         }
                    }
                    
                    if (profileError || !profile) {
                        await supabase.auth.signOut();
                        toast.error("Perfil não encontrado ou erro de permissão (406). Verifique as políticas de RLS.");
                        setLoading(false);
                        return;
                    }
                }

                onLoginSuccess();
            }
        } catch (err: any) {
            toast.error("Erro no login: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 bg-[#130d0d] flex items-center justify-center p-6 min-h-screen">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative"
            >
                {/* Decorative glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="bg-[#1a1414] p-10 rounded-[40px] border border-accent/20 shadow-2xl relative z-10 overflow-hidden">
                    <button 
                        onClick={onBack}
                        className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors"
                        aria-label="Voltar"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex justify-center mb-8 mt-4">
                         <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                         </div>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-white text-3xl font-serif mb-2">Acesso Admin</h2>
                        <p className="text-accent text-xs uppercase tracking-widest font-bold">Gestão Bella Sousa</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">E-mail Administrativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/50" />
                                <input
                                    required
                                    type="email"
                                    placeholder="admin@bellasousa.com.br"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#130d0d] border border-accent/20 text-white placeholder-slate-600 rounded-xl p-4 pl-12 focus:outline-none focus:border-accent transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Senha Mestra</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/50" />
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#130d0d] border border-accent/20 text-white placeholder-slate-600 rounded-xl p-4 pl-12 pr-12 focus:outline-none focus:border-accent transition-all font-medium"
                                />
                                 <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-accent transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent/90 text-primary py-5 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-accent/20 group mt-8 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Acessar Painel"}
                            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
