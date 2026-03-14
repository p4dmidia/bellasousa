import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Home, 
  Package, 
  Users, 
  Settings,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Plus,
  X,
  Search,
  CheckCircle,
  FileText
} from 'lucide-react';
import { initialNetworkData, TreeNode } from './NetworkTree';
import { supabase, ORGANIZATION_ID } from '../lib/supabase';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

export default function AdminDashboard({ onLogout, onNavigateHome }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'affiliates' | 'settings'>('overview');
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'sales' | 'network'>('details');

  // Commission Config State
  const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('percentage');
  const [networkDepth, setNetworkDepth] = useState(5);
  const [levelCommissions, setLevelCommissions] = useState<string[]>(['10', '5', '3', '2', '1']);

  // Real Data State
  const [products, setProducts] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', ORGANIZATION_ID);
      
      // Fetch Affiliates (User Profiles with non-member role if applicable, or just all users for this org)
      const { data: affiliatesData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('organization_id', ORGANIZATION_ID);

      // Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          user_profiles!orders_user_id_fkey (full_name)
        `)
        .eq('organization_id', ORGANIZATION_ID)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
      setAffiliates(affiliatesData || []);
      setOrders(ordersData || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleDepthChange = (newDepth: number) => {
    if (newDepth < 1 || newDepth > 10) return;
    setNetworkDepth(newDepth);
    setLevelCommissions(prev => {
      const newCommissions = [...prev];
      if (newDepth > prev.length) {
        for (let i = prev.length; i < newDepth; i++) newCommissions.push('1');
      } else {
        newCommissions.length = newDepth;
      }
      return newCommissions;
    });
  };

  const handleLevelCommissionChange = (index: number, value: string) => {
    const newCommissions = [...levelCommissions];
    newCommissions[index] = value;
    setLevelCommissions(newCommissions);
  };

  // Calculate stats from real data
  const totalRevenue = orders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const newAffiliates = affiliates.length; // Simplified for now
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  const stats = [
    { label: 'Receita Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <DollarSign className="w-5 h-5" />, trend: 'Real', color: 'from-accent to-accent/50' },
    { label: 'Pedidos Realizados', value: orders.length.toString(), icon: <ShoppingCart className="w-5 h-5" />, trend: 'Total', color: 'from-blue-500 to-blue-400' },
    { label: 'Total Afiliados', value: affiliates.length.toString(), icon: <Users className="w-5 h-5" />, trend: 'Base', color: 'from-purple-500 to-purple-400' },
    { label: 'Ticket Médio', value: `R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <TrendingUp className="w-5 h-5" />, trend: 'Média', color: 'from-green-500 to-green-400' },
  ];

  const filteredAffiliates = affiliates.filter(a => 
    (a.full_name || "").toLowerCase().includes(affiliateSearch.toLowerCase()) || 
    (a.email || "").toLowerCase().includes(affiliateSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#130d0d] text-white overflow-hidden">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-[#1a1414] border-r border-accent/10 flex flex-col hidden md:flex">
        <div className="p-8 border-b border-accent/10">
          <h2 className="text-2xl font-serif text-white">Bella Sousa</h2>
          <p className="text-accent text-[10px] font-bold uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
              activeTab === 'overview' ? 'bg-accent text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            Visão Geral
          </button>
          
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
              activeTab === 'products' ? 'bg-accent text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Package className="w-5 h-5" />
            Produtos
          </button>

          <button
            onClick={() => setActiveTab('affiliates')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
              activeTab === 'affiliates' ? 'bg-accent text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Afiliados & Rede
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
              activeTab === 'settings' ? 'bg-accent text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-accent/10 space-y-2">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
          >
            Ver Loja
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Sair do Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#130d0d]">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-serif mb-2 text-white">
                {activeTab === 'overview' && 'Visão Geral do Negócio'}
                {activeTab === 'products' && 'Catálogo de Produtos'}
                {activeTab === 'affiliates' && 'Gestão de Afiliados'}
                {activeTab === 'settings' && 'Configurações da Loja'}
              </h1>
              <p className="text-slate-500 text-sm">Acompanhe e gerencie os resultados da sua boutique.</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity`} />
                      <div className="relative z-10 flex justify-between items-start mb-6">
                        <div className="p-3 bg-white/5 rounded-2xl text-accent">
                          {stat.icon}
                        </div>
                        <span className="text-xs font-bold text-accent/80 bg-accent/10 px-2 py-1 rounded-lg">{stat.trend}</span>
                      </div>
                      <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-serif text-white">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo Rápido */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Últimos Pedidos</h3>
                     <div className="space-y-4">
                       {[1, 2, 3].map((_, i) => (
                         <div key={i} className="flex justify-between items-center p-4 bg-[#130d0d] rounded-2xl border border-white/5">
                           <div>
                             <p className="text-sm font-medium text-white">Pedido #4{i}92</p>
                             <p className="text-xs text-slate-500">Há {i + 1} hora(s)</p>
                           </div>
                           <span className="text-accent font-medium">R$ 245,00</span>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Avisos do Sistema</h3>
                     <div className="space-y-4">
                        <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                          <p className="text-sm text-accent font-medium">Estoque Baixo</p>
                          <p className="text-xs text-slate-400 mt-1">Sérum Facial de Lótus restam apenas 12 unidades.</p>
                        </div>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                          <p className="text-sm text-blue-400 font-medium">Novos Cadastros</p>
                          <p className="text-xs text-slate-400 mt-1">3 novas consultoras aguardam aprovação.</p>
                        </div>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Buscar produto..." 
                        className="bg-[#1a1414] border border-accent/10 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent w-64"
                      />
                   </div>
                   <button 
                     onClick={() => setShowNewProductModal(true)}
                     className="flex items-center gap-2 bg-accent text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors"
                   >
                     <Plus className="w-4 h-4" /> Novo Produto
                   </button>
                </div>

                <div className="bg-[#1a1414] border border-accent/10 rounded-3xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#130d0d] border-b border-accent/10">
                      <tr>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Produto</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Estoque</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Preço</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-sm text-white">{p.name}</td>
                          <td className="p-4 text-sm text-slate-400">{p.stock_quantity} un.</td>
                          <td className="p-4 text-sm text-white">R$ {p.price?.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                              p.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {p.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-accent hover:text-white cursor-pointer transition-colors">Editar</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* AFFILIATES TAB */}
             {activeTab === 'affiliates' && (
              <motion.div
                key="affiliates"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Stats for Affiliates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Afiliados</p>
                      <p className="text-2xl font-serif text-white">452</p>
                    </div>
                  </div>
                  <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Faturamento (Indicações)</p>
                      <p className="text-2xl font-serif text-white text-green-400">R$ 54.200,00</p>
                    </div>
                  </div>
                  <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Comissões a Pagar</p>
                      <p className="text-2xl font-serif text-white text-accent">R$ 12.840,00</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                   <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Buscar por nome ou ID..." 
                        value={affiliateSearch}
                        onChange={(e) => setAffiliateSearch(e.target.value)}
                        className="bg-[#1a1414] border border-accent/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent w-72"
                      />
                   </div>
                </div>

                <div className="bg-[#1a1414] border border-accent/10 rounded-3xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#130d0d] border-b border-accent/10">
                      <tr>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Consultora</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Nível</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Ganhos Totais</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Saldo</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAffiliates.map((a) => (
                        <tr key={a.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-sm text-white">
                            <div className="flex flex-col">
                              <span className="font-medium text-white">{a.full_name}</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">ID: #{a.id.substring(0, 8)}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-accent">{a.role}</td>
                          <td className="p-4 text-sm text-white">R$ {a.total_earnings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-sm font-bold text-accent">R$ {a.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-sm flex gap-3">
                             <button 
                               className="text-accent hover:text-white cursor-pointer transition-colors flex items-center gap-1"
                               onClick={() => {
                                 setSelectedAffiliate(a);
                                 setActiveModalTab('details');
                               }}
                             >
                               <FileText className="w-4 h-4" /> Gerenciar
                             </button>
                             {a.status === 'pending' && <span className="text-green-400 hover:text-white cursor-pointer transition-colors">Aprovar</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

             {/* SETTINGS TAB */}
             {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-2xl"
              >
                <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 space-y-6">
                   <h3 className="text-lg font-serif text-white border-b border-white/10 pb-4">Conceitos Básicos</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Nome da Loja</label>
                       <input type="text" defaultValue="Bella Sousa" className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" />
                     </div>
                     <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Tipo de Comissionamento</label>
                       <select 
                         value={commissionType}
                         onChange={(e) => setCommissionType(e.target.value as 'fixed' | 'percentage')}
                         className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none appearance-none"
                       >
                         <option value="percentage">Percentual (%) do Pedido</option>
                         <option value="fixed">Valor Fixo (R$) por Ponto</option>
                       </select>
                     </div>
                   </div>
                 </div>

                 <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 space-y-6">
                   <div className="flex justify-between items-center border-b border-white/10 pb-4">
                     <h3 className="text-lg font-serif text-white">Plano de Carreira (MMN)</h3>
                     <div className="flex items-center gap-4">
                       <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Profundidade (Níveis):</span>
                       <div className="flex items-center bg-[#130d0d] border border-white/10 rounded-xl overflow-hidden">
                         <button onClick={() => handleDepthChange(networkDepth - 1)} className="px-3 py-2 text-white hover:bg-white/5 transition-colors">-</button>
                         <span className="px-4 text-white font-medium">{networkDepth}</span>
                         <button onClick={() => handleDepthChange(networkDepth + 1)} className="px-3 py-2 text-white hover:bg-white/5 transition-colors">+</button>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <p className="text-sm text-slate-400">Configure o repasse de comissão para cada nível da rede. Nível 1 é a vendedora direta.</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {Array.from({ length: networkDepth }).map((_, idx) => (
                         <div key={idx} className="bg-[#130d0d] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                           <span className="text-sm font-bold text-accent">Nível {idx + 1}</span>
                           <div className="flex items-center gap-2">
                             <input 
                               type="number" 
                               value={levelCommissions[idx]}
                               onChange={(e) => handleLevelCommissionChange(idx, e.target.value)}
                               className="w-20 bg-transparent border-b border-accent/40 text-right text-white focus:border-accent outline-none font-medium" 
                             />
                             <span className="text-slate-500 font-medium">
                               {commissionType === 'percentage' ? '%' : 'R$'}
                             </span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>

                   <div className="pt-4">
                     <button className="w-full md:w-auto bg-accent text-primary px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
                       Salvar Regras de Comissionamento
                     </button>
                   </div>
                 </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

      {/* New Product Modal */}
      <AnimatePresence>
        {showNewProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1414] border border-accent/20 rounded-3xl p-8 max-w-2xl w-full relative"
            >
              <button 
                onClick={() => setShowNewProductModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-serif text-white mb-2">Novo Produto</h3>
                <p className="text-slate-400 text-sm">Preencha os dados simulados abaixo para adicionar ao catálogo.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Nome do Produto</label>
                  <input type="text" placeholder="Ex: Batom Matte Vermelho" className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Preço (R$)</label>
                    <input type="text" placeholder="0,00" className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Estoque Inicial</label>
                    <input type="number" placeholder="0" className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" />
                  </div>
                </div>
                <button 
                  onClick={() => setShowNewProductModal(false)}
                  className="w-full bg-accent text-primary py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent/90 transition-colors mt-4"
                >
                  Salvar Produto (Simulação)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Affiliate Modal */}
      <AnimatePresence>
        {selectedAffiliate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1414] border border-accent/20 rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative"
            >
              <button 
                onClick={() => setSelectedAffiliate(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-2xl font-serif text-white">{selectedAffiliate.full_name}</h3>
                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded font-bold uppercase tracking-widest">{selectedAffiliate.role}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{selectedAffiliate.email}</p>
                </div>
                
                <div className="flex gap-2 bg-[#130d0d] p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setActiveModalTab('details')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeModalTab === 'details' ? 'bg-accent text-primary' : 'text-slate-400 hover:text-white'}`}
                  >
                    Resumo
                  </button>
                  <button 
                    onClick={() => setActiveModalTab('sales')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeModalTab === 'sales' ? 'bg-accent text-primary' : 'text-slate-400 hover:text-white'}`}
                  >
                    Pedidos
                  </button>
                  <button 
                    onClick={() => setActiveModalTab('network')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeModalTab === 'network' ? 'bg-accent text-primary' : 'text-slate-400 hover:text-white'}`}
                  >
                    Rede
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-8">
                {activeModalTab === 'details' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Saldo a Pagar</p>
                        <p className="text-2xl font-serif text-accent">R$ {selectedAffiliate.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Recebido</p>
                        <p className="text-2xl font-serif text-white">R$ 4.250,80</p>
                      </div>
                      <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total de Vendas</p>
                        <p className="text-2xl font-serif text-white">{orders.filter(o => o.user_id === selectedAffiliate.id).length}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-accent/5 border border-accent/20 rounded-2xl">
                      <div>
                        <h4 className="text-accent font-bold uppercase text-xs tracking-widest mb-1">Liquidar Comissão</h4>
                        <p className="text-xs text-slate-400">Clique para confirmar que o pagamento de R$ {selectedAffiliate.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi realizado via PIX/Transferência.</p>
                      </div>
                      <button 
                        onClick={() => {
                          alert(`Pagamento de R$ ${selectedAffiliate.balance} confirmado para ${selectedAffiliate.full_name}!`);
                          setSelectedAffiliate(null);
                        }}
                        className="bg-accent text-primary px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-accent/90 transition-all flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Informar Pagamento Realizado
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeModalTab === 'sales' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#130d0d] border-b border-accent/10">
                        <tr>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor Pedido</th>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Sua Comissão</th>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {orders.filter(o => o.referrer_id === selectedAffiliate.id).map((sale, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-xs text-slate-400">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4 text-xs text-white">{sale.user_profiles?.full_name || 'Cliente'}</td>
                            <td className="p-4 text-xs text-white">R$ {sale.total_amount?.toFixed(2)}</td>
                            <td className="p-4 text-xs text-accent font-bold">R$ {(sale.commission_amount || 0).toFixed(2)}</td>
                            <td className="p-4">
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sale.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {sale.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}

                {activeModalTab === 'network' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center p-8 bg-[#130d0d] rounded-2xl border border-white/5 overflow-x-auto">
                    <TreeNode node={initialNetworkData} />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
