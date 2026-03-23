import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  GraduationCap, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Award, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Bell,
  Search,
  Grid,
  List,
  PiggyBank,
  CreditCard,
  ArrowDownToLine,
  History,
  CheckCircle2,
  Clock,
  Link,
  Copy,
  ExternalLink,
  Loader2,
  UserCog,
  Upload,
  Menu,
  X,
  Zap,
  ShoppingCart
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase, ORGANIZATION_ID } from '../lib/supabase';

import { AffiliateNode, initialNetworkData, TreeNode } from './NetworkTree';
interface DashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

export default function Dashboard({ onLogout, onNavigateHome }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'financial' | 'training' | 'profile'>('overview');
  const [networkView, setNetworkView] = useState<'tree' | 'list'>('tree');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const [profileForm, setProfileForm] = useState({
    nome: '',
    email: '',
    phone: '',
    cpf: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [treeData, setTreeData] = useState<AffiliateNode | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast("Imagem muito grande. Máximo 2MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to 'product-images' bucket (shared for now as it exists)
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Update Profile Table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      showToast("Foto de perfil atualizada!");
      
    } catch (error: any) {
      console.error("Erro no upload:", error);
      showToast("Erro ao carregar imagem.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const [profile, setProfile] = useState<any>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myTransactions, setMyTransactions] = useState<any[]>([]);
  const [myNetwork, setMyNetwork] = useState<any[]>([]);
  const [leadershipConfig, setLeadershipConfig] = useState<any[]>([
    { name: 'Bronze', threshold: 500, percentage: 1 },
    { name: 'Prata', threshold: 1000, percentage: 1 },
    { name: 'Ouro', threshold: 2500, percentage: 1 },
    { name: 'Diamante', threshold: 5000, percentage: 1 }
  ]);
  const [stats, setStats] = useState([
    { label: 'Nível Atual', value: 'Consultor', icon: <Award className="w-5 h-5" />, trend: 'Nível', color: 'bg-purple-500' },
    { label: 'Total de Vendas', value: 'R$ 0,00', icon: <Zap className="w-5 h-5" />, trend: 'Ranking', color: 'bg-orange-500' },
  ]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      
      if (!user) {
        onLogout();
        return;
      }
      setCurrentUser(user);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
        
        // Fetch Configs
        const { data: siteConfig } = await supabase
          .from('site_configs')
          .select('leadership_bonus_config, commission_type, level_commissions')
          .eq('organization_id', ORGANIZATION_ID)
          .maybeSingle();

        if (siteConfig?.leadership_bonus_config) {
          setLeadershipConfig(siteConfig.leadership_bonus_config);
        }
        
        const userOrgId = profileData.organization_id || ORGANIZATION_ID;

        // Fetch All Users for this organization
        const { data: allUsers, error: usersError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('organization_id', userOrgId);
        
        if (usersError) console.error("Dashboard: Error fetching users:", usersError);
        const usersList = allUsers || [];

        // Fetch Orders for this organization
        const { data: allOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('organization_id', userOrgId)
          .order('created_at', { ascending: false });
        
        if (ordersError) console.error("Dashboard: Error fetching orders:", ordersError);
        const ordersListRaw = allOrders || [];

        // 1. Recursive function to build the network tree structure
        const generateTree = (uId: string, list: any[], rawOrders: any[]): AffiliateNode | null => {
          const userNode = list.find(u => u.id === uId);
          if (!userNode) return null;

          const children = list
            .filter(u => (u.referrer_id === uId || u.sponsor_id === uId))
            .map(child => generateTree(child.id, list, rawOrders))
            .filter((node): node is AffiliateNode => node !== null);

          // Calculate volume for this node's sales
          const userOrders = rawOrders.filter(o => o.affiliate_id === uId || o.referrer_id === uId);
          const totalVolume = userOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);

          return {
            id: userNode.id,
            name: userNode.login || userNode.email?.split('@')[0] || 'Consultora',
            level: userNode.role === 'affiliate' ? 'Consultora' : (userNode.role || 'Consultora'),
            pts: totalVolume.toLocaleString('pt-BR'),
            image: userNode.avatar_url,
            children: children.length > 0 ? children : undefined
          };
        };

        const tree = generateTree(user.id, usersList, ordersListRaw);
        setTreeData(tree);

        // 2. Identify current user's network
        const network = usersList.filter(u => u.referrer_id === user.id || u.sponsor_id === user.id);
        setMyNetwork(network);

        // 3. Fetch Wallet Transactions for financial history
        const { data: txList, error: txError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (txError) console.warn("Dashboard: wallet_transactions table might not exist yet:", txError);
        const currentTransactions = txList || [];
        setMyTransactions(currentTransactions);

        setMyOrders(ordersListRaw.filter(o => o.affiliate_id === user.id || o.referrer_id === user.id));

        // 4. Calculate Stats & Potential Commissions
        const commType = siteConfig?.commission_type || 'percentage';
        const commLevels = siteConfig?.level_commissions || ['10', '5', '3', '2', '1'];

        const calculatedBalance = profileData.balance || 0;
        const totalConfirmed = currentTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
        const totalPending = ordersListRaw
          .filter(o => o.status === 'pending' && (o.affiliate_id === user.id || o.referrer_id === user.id))
          .reduce((acc, o) => acc + (o.commission_amount || 0), 0);
        
        setStats([
          { label: 'Saldo Disponível', value: `R$ ${calculatedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <Wallet className="w-5 h-5" />, trend: 'Disponível', color: 'bg-green-500' },
          { label: 'Comissão a Liberar', value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <Clock className="w-5 h-5" />, trend: 'Pendente', color: 'bg-yellow-500' },
          { label: 'Consultoras Diretas', value: network.length.toString(), icon: <Users className="w-5 h-5" />, trend: 'Rede', color: 'bg-blue-500' },
          { label: 'Total Recebido', value: `R$ ${totalConfirmed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <Zap className="w-5 h-5" />, trend: 'Confirmado', color: 'bg-orange-500' },
        ]);

        // 5. Update Profile Form
        setProfileForm({
           nome: user?.user_metadata?.full_name || user?.user_metadata?.nome || profileData.login || '',
           email: user.email || '',
           phone: user?.user_metadata?.phone || user?.user_metadata?.whatsapp || profileData.phone || '',
           cpf: user?.user_metadata?.cpf || profileData.cpf || '',
           newPassword: '',
           confirmPassword: ''
        });
      }
    } catch (error) {
       console.error("Dashboard: Fatal error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      showToast("As senhas não coincidem.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
       // Update Password AND Metadata
       const updatePayload: any = {
          data: {
             nome: profileForm.nome,
             full_name: profileForm.nome,
             phone: profileForm.phone,
             cpf: profileForm.cpf
          }
       };

       if (profileForm.newPassword) {
          updatePayload.password = profileForm.newPassword;
       }

       const { error: authError } = await supabase.auth.updateUser(updatePayload);
       if (authError) throw authError;

       // Update profile table for fields that might exist (optional fallback)
       // We'll wrap this in a simple check or try-catch since we know 'nome'/'full_name' might fail
       try {
           await supabase
             .from('user_profiles')
             .update({
                 nome: profileForm.nome,
                 phone: profileForm.phone,
                 cpf: profileForm.cpf
             })
             .eq('id', profile.id);
       } catch (tableErr) {
           console.warn("Table update skipped or failed, but auth metadata was updated:", tableErr);
       }

       showToast("Perfil atualizado com sucesso!");
       setProfileForm(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
       
       // Update local profile state and current user state
       setProfile((prev: any) => ({
           ...prev,
           nome: profileForm.nome,
           phone: profileForm.phone,
           cpf: profileForm.cpf
       }));

       const { data: { user: updatedUser } } = await supabase.auth.getUser();
       setCurrentUser(updatedUser);

    } catch (error: any) {
        console.error("Erro ao atualizar perfil:", error);
        showToast("Erro ao atualizar: " + error.message);
    } finally {
        setIsUpdatingProfile(false);
    }
  };

  const recentActivity = myTransactions.slice(0, 5).map(tx => ({
    type: 'commission',
    text: tx.description,
    amount: `+ R$ ${(tx.amount || 0).toFixed(2)}`,
    date: new Date(tx.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));

  const chartData = [
    { month: 'Jan', value: 20 },
    { month: 'Fev', value: 40 },
    { month: 'Mar', value: 60 },
  ];



  if (loading) {
    return (
      <div className="flex h-screen bg-[#1c1616] items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1c1616] text-white">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-[#130d0d] border-b border-accent/10 flex items-center justify-between px-6 z-50">
        <h2 className="font-serif italic text-xl text-accent">Bela Sousa</h2>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white/5 rounded-xl text-accent border border-accent/20"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 border-r border-accent/10 bg-[#1c1616] flex flex-col z-[70] transition-transform duration-300 transform lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-accent/10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-accent p-1 mb-4 overflow-hidden bg-white/10 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Consultora" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Users className="w-10 h-10 text-accent" />
            )}
          </div>
          <h2 className="font-serif italic text-xl text-center">
              {profile?.login || currentUser?.user_metadata?.nome || currentUser?.user_metadata?.full_name?.split(' ')[0] || 'Consultora'}
          </h2>
          <span className="text-[10px] uppercase tracking-widest text-accent font-bold">{profile?.rank || 'Consultor'}</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm">Visão Geral</span>
          </button>
          <button 
            onClick={() => { setActiveTab('network'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'network' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-sm">Minha Rede</span>
          </button>
          <button 
            onClick={() => { setActiveTab('financial'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'financial' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-sm">Financeiro</span>
          </button>
          <button 
            onClick={() => { setActiveTab('training'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'training' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-sm">Treinamentos</span>
          </button>
          <button 
            onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <UserCog className="w-5 h-5" />
            <span className="text-sm">Meu Perfil</span>
          </button>
        </nav>

        <div className="p-4 border-t border-accent/10 space-y-2">
          <button 
            onClick={onNavigateHome}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 transition-all"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span className="text-sm">Ir para a Loja</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all font-bold"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#130d0d] pt-20 lg:pt-0">
        <header className="p-4 lg:p-8 flex justify-between items-center border-b border-accent/10 sticky top-0 lg:top-0 bg-[#130d0d]/80 backdrop-blur-md z-10">
          <div>
            <h1 className="text-xl lg:text-3xl font-serif">Escritório Virtual</h1>
            <p className="hidden lg:block text-slate-500 text-sm">
                Bem-vinda, {profile?.login || currentUser?.user_metadata?.nome || currentUser?.user_metadata?.full_name?.split(' ')[0] || 'Consultora'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar recursos..." 
                className="bg-white/5 border border-accent/20 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent/50 w-64"
              />
            </div>
            <button className="relative p-2 rounded-full hover:bg-white/5">
              <Bell className="w-5 h-5 text-accent" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-10">
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Affiliate Links Section */}
              <div className="bg-gradient-to-r from-accent/20 to-transparent border border-accent/20 p-8 rounded-[40px] flex flex-col lg:flex-row justify-between items-center gap-8">
                <div>
                  <h3 className="font-serif text-2xl italic mb-2">Seus Links de Indicação</h3>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Compartilhe e ganhe comissões sobre vendas e novas consultoras</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
                  {/* Home Link */}
                  <div className="flex-1 lg:w-80 bg-[#1a1414] border border-accent/10 rounded-2xl p-4 flex justify-between items-center group hover:border-accent/40 transition-all shadow-lg overflow-hidden">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1.5 flex items-center gap-1.5">
                        <Grid className="w-3 h-3 text-accent/50" />
                        Página Principal (Home)
                      </p>
                      <div className="bg-black/20 rounded-lg px-2 py-1.5 border border-white/5">
                        <p className="text-xs text-accent truncate font-mono select-all">
                          {window.location.host}/?ref={profile?.id}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/?ref=${profile?.id}`;
                        navigator.clipboard.writeText(link);
                        showToast("Link da Home copiado com sucesso!");
                      }}
                      className="flex flex-col items-center gap-1 p-3 bg-accent text-primary rounded-xl hover:bg-accent/90 transition-all shrink-0 shadow-xl group-hover:scale-105"
                      title="Copiar Link"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase tracking-tighter">Copiar</span>
                    </button>
                  </div>

                  {/* Cadastro Link */}
                  <div className="flex-1 lg:w-80 bg-[#1a1414] border border-accent/10 rounded-2xl p-4 flex justify-between items-center group hover:border-accent/40 transition-all shadow-lg overflow-hidden">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-accent/50" />
                        Página de Cadastro
                      </p>
                      <div className="bg-black/20 rounded-lg px-2 py-1.5 border border-white/5">
                        <p className="text-xs text-accent truncate font-mono select-all">
                          {window.location.host}/cadastro?ref={profile?.id}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/cadastro?ref=${profile?.id}`;
                        navigator.clipboard.writeText(link);
                        showToast("Link de Cadastro copiado com sucesso!");
                      }}
                      className="flex flex-col items-center gap-1 p-3 bg-accent text-primary rounded-xl hover:bg-accent/90 transition-all shrink-0 shadow-xl group-hover:scale-105"
                      title="Copiar Link"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase tracking-tighter">Copiar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-accent/10 p-6 rounded-[30px] shadow-2xl group hover:border-accent/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg`}>
                        {stat.icon}
                      </div>
                      <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full uppercase tracking-widest leading-none">
                        {stat.trend}
                      </span>
                    </div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</h3>
                    <p className="text-2xl font-serif">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Rank Progress Bar */}
              <div className="bg-[#1a1414] border border-accent/10 p-8 rounded-[40px] shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-serif text-2xl italic">Evolução de Carreira</h3>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Próxima meta de faturamento</p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent text-sm font-bold uppercase tracking-widest">
                      {(() => {
                        const sortedConfig = [...leadershipConfig].sort((a, b) => a.threshold - b.threshold);
                        const nextRank = sortedConfig.find(c => (profile?.total_sales || 0) < c.threshold);
                        return nextRank ? `Próximo Nível: ${nextRank.name}` : 'Nível Máximo';
                      })()}
                    </p>
                  </div>
                </div>
                
                {(() => {
                  const sortedConfig = [...leadershipConfig].sort((a, b) => a.threshold - b.threshold);
                  const nextRank = sortedConfig.find(c => (profile?.total_sales || 0) < c.threshold);
                  
                  if (!nextRank) return null;

                  const currentSales = profile?.total_sales || 0;
                  const threshold = nextRank.threshold;
                  const progress = Math.min(100, (currentSales / threshold) * 100);
                  const remaining = threshold - currentSales;

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-tighter text-slate-400">
                        <span>R$ {currentSales.toLocaleString('pt-BR')}</span>
                        <span>R$ {threshold.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-gradient-to-r from-accent to-[#D4A373] rounded-full shadow-[0_0_20px_rgba(212,163,115,0.3)]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 italic text-center">
                        Faltam R$ {remaining.toLocaleString('pt-BR')} para o nível {nextRank.name}!
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart Placeholder */}
                <div className="lg:col-span-2 bg-white/5 border border-accent/10 p-8 rounded-[40px]">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-serif text-2xl group flex items-center gap-3">
                      Crescimento da Rede
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </h3>
                    <select className="bg-transparent border border-accent/20 rounded-lg text-xs p-2 focus:outline-none">
                      <option>Últimos 6 meses</option>
                      <option>Últimos 12 meses</option>
                    </select>
                  </div>
                  <div className="h-64 flex items-end gap-3 px-4">
                    {chartData.map((data, i) => (
                      <div key={i} className="flex-1 group relative">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${data.value}%` }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-accent/40 group-hover:bg-accent rounded-t-lg transition-all relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-white/5 to-white/10" />
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <span className="text-[10px] font-bold text-white bg-primary px-2 py-1 rounded-md">{data.value}%</span>
                          </div>
                        </motion.div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white/5 border border-accent/10 p-8 rounded-[40px]">
                  <h3 className="font-serif text-2xl mb-8">Atividade Recente</h3>
                  <div className="space-y-6">
                    {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="w-2 h-2 rounded-full bg-accent mt-2 group-last:bg-accent/20" />
                        <div>
                          <p className="text-sm font-medium">{activity.text}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{activity.date}</span>
                            {activity.amount && (
                              <span className="text-[10px] text-green-400 font-bold">{activity.amount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-slate-500 text-sm italic">Nenhuma atividade recente.</p>
                    )}
                  </div>
                  <button className="w-full mt-10 py-4 border border-accent/20 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-accent/5 transition-all">
                    Ver todo o histórico
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'network' && (
             <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-white/5 border border-accent/10 p-8 rounded-[40px]">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                  <div>
                    <h3 className="font-serif text-3xl italic">Minha Rede de Consultoras</h3>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Visualização de Indicação Direta e Indireta</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => fetchDashboardData()}
                      className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-accent/20 rounded-2xl text-[10px] uppercase font-bold tracking-[0.2em] text-accent hover:bg-accent/10 transition-all active:scale-95 shadow-lg overflow-hidden relative group"
                    >
                      <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                      <span>{loading ? 'Sincronizando...' : 'Atualizar Rede'}</span>
                    </button>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-accent/10">
                    <button 
                      onClick={() => setNetworkView('tree')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${networkView === 'tree' ? 'bg-accent text-primary' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Grid className="w-4 h-4" />
                      Visual
                    </button>
                    <button 
                      onClick={() => setNetworkView('list')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${networkView === 'list' ? 'bg-accent text-primary' : 'text-slate-400 hover:text-white'}`}
                    >
                      <List className="w-4 h-4" />
                      Lista
                    </button>
                    </div>
                  </div>
                </div>

                {networkView === 'tree' ? (
                  <div className="bg-[#1a1414] rounded-3xl p-12 overflow-x-auto min-h-[500px] flex justify-center items-start">
                    <div className="inline-block">
                      {treeData ? (
                        <TreeNode node={treeData} />
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                           <Loader2 className="w-8 h-8 animate-spin" />
                           <p className="italic">Gerando visualização da rede...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-accent/5">
                          <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Consultora</th>
                          <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Nível</th>
                          <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Volume (Pts)</th>
                          <th className="pb-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-accent/5">
                        {myNetwork.map((row, i) => (
                          <tr key={i} className="group hover:bg-white/5 transition-all">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                                  {row.full_name?.substring(0,2).toUpperCase()}
                                </div>
                                <span className="font-medium text-sm">
                                    {row.login || row.email?.split('@')[0] || 'Consultora'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 text-sm font-light text-slate-300">{row.role || 'Consultora'}</td>
                            <td className="py-4 text-sm font-bold text-accent">0</td>
                            <td className="py-4">
                              <button className="text-[10px] uppercase font-bold text-slate-500 hover:text-accent transition-colors">Ver Perfil</button>
                            </td>
                          </tr>
                        ))}
                        {myNetwork.length === 0 && (
                          <tr><td colSpan={4} className="py-8 text-center text-slate-500 text-sm">Você ainda não possui consultoras em sua rede.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'financial' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              {/* Balances Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-accent to-[#D4A373] p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                    <Wallet className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-primary/70 text-xs font-bold uppercase tracking-widest mb-2">Saldo Disponível</h3>
                  <p className="text-4xl font-serif text-primary mb-6">R$ {profile?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                  <button className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] uppercase font-bold tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2">
                    <ArrowDownToLine className="w-4 h-4" />
                    Solicitar Saque
                  </button>
                </div>

                <div className="bg-white/5 border border-accent/10 p-8 rounded-[40px] shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-white/5 text-accent">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">A Liberar</h3>
                  <p className="text-3xl font-serif">R$ {myOrders.filter(o => o.status !== 'completed').reduce((acc, o) => acc + (o.commission_amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-slate-500 mt-2">Valores de pedidos pendentes</p>
                </div>

                <div className="bg-white/5 border border-accent/10 p-8 rounded-[40px] shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-white/5 text-accent">
                      <PiggyBank className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Recebido</h3>
                  <p className="text-3xl font-serif">R$ {myOrders.filter(o => o.status === 'completed').reduce((acc, o) => acc + (o.commission_amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-green-400 mt-2 font-bold">Comissões confirmadas</p>
                </div>
              </div>

              {/* Transactions History */}
              <div className="bg-white/5 border border-accent/10 p-10 rounded-[40px]">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <History className="w-6 h-6 text-accent" />
                    <h3 className="font-serif text-3xl italic">Extrato de Transações</h3>
                  </div>
                  <div className="flex gap-4">
                    <button className="px-5 py-2 rounded-xl bg-white/5 text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-white border border-accent/5">Exportar PDF</button>
                    <select className="bg-[#1a1414] border border-accent/20 rounded-xl text-[10px] uppercase font-bold tracking-widest p-2 focus:outline-none focus:border-accent">
                      <option>Todos os tipos</option>
                      <option>Comissões</option>
                      <option>Bônus</option>
                      <option>Saques</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-accent/5">
                        <th className="pb-6 text-[10px] uppercase tracking-widest font-bold text-slate-500">Data</th>
                        <th className="pb-6 text-[10px] uppercase tracking-widest font-bold text-slate-500">Descrição</th>
                        <th className="pb-6 text-[10px] uppercase tracking-widest font-bold text-slate-500">Tipo</th>
                        <th className="pb-6 text-[10px] uppercase tracking-widest font-bold text-slate-500">Valor</th>
                        <th className="pb-6 text-[10px] uppercase tracking-widest font-bold text-slate-500 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-accent/5">
                      {myTransactions.map((tx, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-all">
                          <td className="py-6 text-sm text-slate-400">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="py-6 text-sm font-medium">{tx.description}</td>
                          <td className="py-6">
                            <span className="text-[10px] uppercase font-bold bg-white/5 border border-accent/10 px-2 py-1 rounded-md text-slate-400">
                                {tx.type === 'commission' ? 'Comissão' : tx.type === 'bonus' ? 'Bônus' : 'Outro'}
                            </span>
                          </td>
                          <td className="py-6 text-sm font-bold text-green-400">+ R$ {(tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-6 text-right">
                             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${tx.status === 'confirmed' ? 'bg-green-400/10 text-green-400' : 'bg-accent/10 text-accent'}`}>
                               <CheckCircle2 className="w-3 h-3" />
                               {tx.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                             </div>
                          </td>
                        </tr>
                      ))}
                      {myTransactions.length === 0 && (
                        <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">Nenhuma transação encontrada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'training' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Boas-vindas VIP', duration: '15 min', type: 'Vídeo' },
                { title: 'Arte da Consultoria', duration: '45 min', type: 'Guia PDF' },
                { title: 'MMN na Prática', duration: '120 min', type: 'Workshop' },
              ].map((course, i) => (
                <div key={i} className="bg-white/5 border border-accent/10 overflow-hidden rounded-[30px] group hover:border-accent/30 transition-all">
                  <div className="aspect-video bg-accent/10 flex items-center justify-center relative">
                    <GraduationCap className="w-10 h-10 text-accent/40 group-hover:scale-110 transition-transform" />
                    <div className="absolute bottom-4 right-4 bg-primary/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">{course.duration}</div>
                  </div>
                  <div className="p-6">
                    <span className="text-[9px] uppercase tracking-widest text-accent font-bold mb-2 block">{course.type}</span>
                    <h4 className="text-xl font-serif mb-4">{course.title}</h4>
                    <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all">Começar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="bg-white/5 border border-accent/10 p-8 md:p-12 rounded-[40px]">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 pb-8 border-b border-accent/10">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-accent p-1 overflow-hidden bg-[#1a1414] flex items-center justify-center">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                      ) : profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <Users className="w-12 h-12 text-accent/20" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                      <Upload className="w-6 h-6 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      />
                    </label>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="font-serif text-2xl italic">Sua Foto de Perfil</h3>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest mb-4">Aparece no seu painel e na rede de consultoras</p>
                    <label className="inline-flex items-center gap-2 px-6 py-2 bg-accent/10 border border-accent/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-primary transition-all cursor-pointer">
                      <Upload className="w-3 h-3" />
                      {isUploadingAvatar ? 'Carregando...' : 'Alterar Foto'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <UserCog className="w-8 h-8 text-accent" />
                  <div>
                    <h3 className="font-serif text-3xl italic">Configurações do Perfil</h3>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Atualize seus dados e credenciais</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6" autoComplete="off">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Nome Completo</label>
                       <input 
                         type="text" 
                         autoComplete="name"
                         value={profileForm.nome || profile?.nome || profile?.full_name || currentUser?.user_metadata?.nome || currentUser?.user_metadata?.full_name || ''}
                         onChange={e => setProfileForm(prev => ({...prev, nome: e.target.value}))}
                         className="w-full bg-[#1a1414] border border-accent/20 rounded-xl p-4 text-white focus:outline-none focus:border-accent transition-all"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">E-mail (Login)</label>
                       <input 
                         type="email" 
                         autoComplete="username"
                         value={profileForm.email || currentUser?.email || ''}
                         disabled
                         className="w-full bg-[#1a1414]/50 border border-white/5 rounded-xl p-4 text-slate-500 cursor-not-allowed"
                         title="E-mail principal não pode ser alterado por aqui"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">WhatsApp / Telefone</label>
                       <input 
                         type="tel" 
                         autoComplete="tel"
                         value={profileForm.phone || profile?.phone || currentUser?.user_metadata?.phone || currentUser?.user_metadata?.whatsapp || ''}
                         onChange={e => setProfileForm(prev => ({...prev, phone: e.target.value}))}
                         className="w-full bg-[#1a1414] border border-accent/20 rounded-xl p-4 text-white focus:outline-none focus:border-accent transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">CPF</label>
                       <input 
                         type="text" 
                         autoComplete="new-password"
                         value={profileForm.cpf || profile?.cpf || currentUser?.user_metadata?.cpf || ''}
                         onChange={e => setProfileForm(prev => ({...prev, cpf: e.target.value}))}
                         className="w-full bg-[#1a1414] border border-accent/20 rounded-xl p-4 text-white focus:outline-none focus:border-accent transition-all"
                       />
                    </div>
                  </div>

                  <hr className="border-accent/10 my-8" />
                  
                  <div>
                    <h4 className="font-serif text-xl italic mb-6">Alterar Senha</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Nova Senha</label>
                         <input 
                           type="password" 
                           autoComplete="new-password"
                           placeholder="Deixe em branco para não alterar"
                           value={profileForm.newPassword}
                           onChange={e => setProfileForm(prev => ({...prev, newPassword: e.target.value}))}
                           className="w-full bg-[#1a1414] border border-accent/20 rounded-xl p-4 text-white focus:outline-none focus:border-accent transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Confirmar Nova Senha</label>
                         <input 
                           type="password" 
                           placeholder="Repita a nova senha"
                           value={profileForm.confirmPassword}
                           onChange={e => setProfileForm(prev => ({...prev, confirmPassword: e.target.value}))}
                           className="w-full bg-[#1a1414] border border-accent/20 rounded-xl p-4 text-white focus:outline-none focus:border-accent transition-all"
                         />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">A sua sessão será mantida, mas a nova senha será exigida no próximo login.</p>
                  </div>

                  <div className="pt-6">
                     <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="w-full md:w-auto px-10 py-4 bg-accent text-primary rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isUpdatingProfile ? (
                           <>
                             <Loader2 className="w-4 h-4 animate-spin" />
                             Salvando...
                           </>
                        ) : 'Salvar Alterações'}
                     </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Professional Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-accent text-primary px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-md"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
