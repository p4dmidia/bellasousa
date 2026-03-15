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
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, ORGANIZATION_ID } from '../lib/supabase';

import { AffiliateNode, initialNetworkData, TreeNode } from './NetworkTree';
interface DashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

export default function Dashboard({ onLogout, onNavigateHome }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'financial' | 'training'>('overview');
  const [networkView, setNetworkView] = useState<'tree' | 'list'>('tree');
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myNetwork, setMyNetwork] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { label: 'Saldo Disponível', value: 'R$ 0,00', icon: <Wallet className="w-5 h-5" />, trend: 'Saldo', color: 'bg-green-500' },
    { label: 'Pontos de Equipe (Mês)', value: '0 pts', icon: <Target className="w-5 h-5" />, trend: 'Mensal', color: 'bg-accent' },
    { label: 'Consultoras Diretas', value: '0', icon: <Users className="w-5 h-5" />, trend: 'Rede', color: 'bg-blue-500' },
    { label: 'Nível Atual', value: 'Consultora', icon: <Award className="w-5 h-5" />, trend: 'Nível', color: 'bg-purple-500' },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        onLogout();
        return;
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .eq('organization_id', ORGANIZATION_ID)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        
        // Fetch My Network (Direct referrals)
        // If referrer_id doesn't exist, this might fail with 400. 
        // We'll try to see if parent_id or sponsor_id is more common, but referrer_id was in AdminDashboard.
        const { data: networkData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('referrer_id', user.id)
          .eq('organization_id', ORGANIZATION_ID);
        
        const network = networkData || [];
        setMyNetwork(network);

        // Fetch My Commissions (Orders where I am the referrer)
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            customer:user_profiles!orders_user_id_fkey (full_name)
          `)
          .eq('referrer_id', user.id)
          .eq('organization_id', ORGANIZATION_ID)
          .order('created_at', { ascending: false });
        
        const orders = ordersData || [];
        setMyOrders(orders);

        // Update Stats
        const balance = profileData.balance || 0;
        const totalPoints = 0; // Placeholder for now or calculate from orders if needed
        
        setStats([
          { label: 'Saldo Disponível', value: `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <Wallet className="w-5 h-5" />, trend: 'Disponível', color: 'bg-green-500' },
          { label: 'Pontos de Equipe (Mês)', value: `${totalPoints} pts`, icon: <Target className="w-5 h-5" />, trend: 'Mensal', color: 'bg-accent' },
          { label: 'Consultoras Diretas', value: network.length.toString(), icon: <Users className="w-5 h-5" />, trend: 'Rede', color: 'bg-blue-500' },
          { label: 'Nível Atual', value: profileData.role || 'Consultora', icon: <Award className="w-5 h-5" />, trend: 'Nível', color: 'bg-purple-500' },
        ]);
      }
      
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const recentActivity = myOrders.slice(0, 5).map(order => ({
    type: 'commission',
    text: `Comissão de venda (${order.customer?.full_name || 'Cliente'})`,
    amount: `+ R$ ${(order.commission_amount || 0).toFixed(2)}`,
    date: new Date(order.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));

  const chartData = [
    { month: 'Jan', value: 20 },
    { month: 'Fev', value: 40 },
    { month: 'Mar', value: 60 },
  ];

  const treeData: AffiliateNode | null = profile ? {
    id: profile.id,
    name: profile.full_name,
    level: profile.role || 'Consultora',
    pts: '0', // Placeholder
    image: profile.avatar_url,
    children: myNetwork.map(member => ({
      id: member.id,
      name: member.full_name,
      level: member.role || 'Consultora',
      pts: '0',
      image: member.avatar_url
    }))
  } : null;

  if (loading) {
    return (
      <div className="flex h-screen bg-[#1c1616] items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1c1616] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-accent/10 flex flex-col">
        <div className="p-8 border-b border-accent/10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-2 border-accent p-1 mb-4 overflow-hidden bg-white/10 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Consultora" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Users className="w-10 h-10 text-accent" />
            )}
          </div>
          <h2 className="font-serif italic text-xl text-center">{profile?.full_name || 'Carregando...'}</h2>
          <span className="text-[10px] uppercase tracking-widest text-accent font-bold">{profile?.role || 'Aguarde'}</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm">Visão Geral</span>
          </button>
          <button 
            onClick={() => setActiveTab('network')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'network' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-sm">Minha Rede</span>
          </button>
          <button 
            onClick={() => setActiveTab('financial')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'financial' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-sm">Financeiro</span>
          </button>
          <button 
            onClick={() => setActiveTab('training')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === 'training' ? 'bg-accent text-primary font-bold' : 'hover:bg-accent/10 text-slate-400'}`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-sm">Treinamentos</span>
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
      <main className="flex-1 overflow-y-auto bg-[#130d0d]">
        <header className="p-8 flex justify-between items-center border-b border-accent/10 sticky top-0 bg-[#130d0d]/80 backdrop-blur-md z-10">
          <div>
            <h1 className="text-3xl font-serif">Escritório Virtual</h1>
            <p className="text-slate-500 text-sm">Bem-vinda, {profile?.full_name?.split(' ')[0] || 'Consultora'}</p>
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
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Compartilhe e ganhe comissões sobre vendas e novas consultoras</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="flex-1 lg:w-72 bg-[#1a1414] border border-accent/10 rounded-2xl p-4 flex justify-between items-center group hover:border-accent/40 transition-all">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Loja Pessoal</p>
                      <p className="text-xs text-accent truncate">belasousa.com.br/loja?ref=maria</p>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("https://belasousa.com.br/loja?ref=maria");
                        showToast("Link da Loja copiado com sucesso!");
                      }}
                      className="p-2 hover:bg-accent/10 rounded-lg text-accent transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 lg:w-72 bg-[#1a1414] border border-accent/10 rounded-2xl p-4 flex justify-between items-center group hover:border-accent/40 transition-all">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Página de Cadastro</p>
                      <p className="text-xs text-accent truncate">belasousa.com.br/cadastro?ref={profile?.login || 'id'}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const link = `https://belasousa.com.br/cadastro?ref=${profile?.login || profile?.id}`;
                        navigator.clipboard.writeText(link);
                        showToast("Link de Cadastro copiado com sucesso!");
                      }}
                      className="p-2 hover:bg-accent/10 rounded-lg text-accent transition-colors"
                    >
                      <Copy className="w-4 h-4" />
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

                {networkView === 'tree' ? (
                  <div className="bg-[#1a1414] rounded-3xl p-12 overflow-x-auto min-h-[500px] flex justify-center items-start">
                    <div className="inline-block">
                      {treeData && <TreeNode node={treeData} />}
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
                                <span className="font-medium text-sm">{row.full_name}</span>
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
                  <p className="text-3xl font-serif">R$ 1.840,00</p>
                  <p className="text-[10px] text-slate-500 mt-2">Próxima liberação em 4 dias</p>
                </div>

                <div className="bg-white/5 border border-accent/10 p-8 rounded-[40px] shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-white/5 text-accent">
                      <PiggyBank className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Recebido</h3>
                  <p className="text-3xl font-serif">R$ 18.920,45</p>
                  <p className="text-[10px] text-green-400 mt-2 font-bold">+R$ 2.100 este mês</p>
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
                      {myOrders.map((tx, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-all">
                          <td className="py-6 text-sm text-slate-400">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="py-6 text-sm font-medium">Comissão Venda #{tx.id.substring(0,6)} ({tx.customer?.full_name || 'Cliente'})</td>
                          <td className="py-6">
                            <span className="text-[10px] uppercase font-bold bg-white/5 border border-accent/10 px-2 py-1 rounded-md text-slate-400">Venda</span>
                          </td>
                          <td className="py-6 text-sm font-bold text-green-400">+ R$ {(tx.commission_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-6 text-right">
                             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${tx.status === 'completed' ? 'bg-green-400/10 text-green-400' : 'bg-accent/10 text-accent'}`}>
                               {tx.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                               {tx.status === 'completed' ? 'Confirmado' : 'Pendente'}
                             </div>
                          </td>
                        </tr>
                      ))}
                      {myOrders.length === 0 && (
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
