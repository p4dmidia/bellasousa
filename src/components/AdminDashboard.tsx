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
  FileText,
  Loader2,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  UserX,
  UserCheck
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import { initialNetworkData, TreeNode } from './NetworkTree';
import { supabase, ORGANIZATION_ID } from '../lib/supabase';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
}

export default function AdminDashboard({ onLogout, onNavigateHome }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'affiliates' | 'settings' | 'orders'>('overview');
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'sales' | 'network'>('details');

  // Commission Config State
  const [shopName, setShopName] = useState('Bella Sousa');
  const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('percentage');
  const [networkDepth, setNetworkDepth] = useState(5);
  const [levelCommissions, setLevelCommissions] = useState<string[]>(['10', '5', '3', '2', '1']);
  const [leadershipBonusConfig, setLeadershipBonusConfig] = useState<any[]>([
    { name: 'Bronze', threshold: 500, percentage: 1 },
    { name: 'Prata', threshold: 1000, percentage: 1 },
    { name: 'Ouro', threshold: 2500, percentage: 1 },
    { name: 'Diamante', threshold: 5000, percentage: 1 }
  ]);

  // Real Data State
  const [products, setProducts] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    category: 'Lingerie' // Default category
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch Products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('organization_id', ORGANIZATION_ID)
          .order('created_at', { ascending: false });
        
        // Fetch Affiliates
        const { data: affiliatesData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('organization_id', ORGANIZATION_ID);

        // Fetch Orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`*`)
          .eq('organization_id', ORGANIZATION_ID)
          .order('created_at', { ascending: false });

        // Fetch Configs
        const { data: configData } = await supabase
          .from('site_configs')
          .select('*')
          .eq('organization_id', ORGANIZATION_ID)
          .maybeSingle();
        
        if (configData) {
          setShopName(configData.shop_name || 'Bella Sousa');
          setCommissionType(configData.commission_type || 'percentage');
          setNetworkDepth(configData.network_depth || 5);
          if (configData.level_commissions) {
            setLevelCommissions(configData.level_commissions);
          }
          if (configData.leadership_bonus_config) {
            setLeadershipBonusConfig(configData.leadership_bonus_config);
          }
        }

        setProducts(productsData || []);
        setAffiliates(affiliatesData || []);
        setOrders(ordersData || []);
      } catch (err) {
        console.error("AdminDashboard: Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteAffiliate = async (affiliateId: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Deseja realmente excluir este afiliado? Esta ação removerá o perfil, mas não o usuário de autenticação.</p>
        <div className="flex justify-end gap-2">
          <button 
            className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button 
            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={async () => {
              toast.dismiss(t.id);
              setLoading(true);
              try {
                const { data, error } = await supabase
                  .from('user_profiles')
                  .delete()
                  .eq('id', affiliateId)
                  .select();

                if (error) throw error;
                if (!data || data.length === 0) {
                  throw new Error("Afiliado não foi excluído. Verifique políticas de banco de dados ou dependências.");
                }

                toast.success("Afiliado excluído com sucesso!");
                const { data: updatedData } = await supabase.from('user_profiles').select('*').eq('organization_id', ORGANIZATION_ID);
                setAffiliates(updatedData || []);
              } catch (err: any) {
                toast.error("Erro ao excluir afiliado: " + err.message);
              } finally {
                setLoading(false);
              }
            }}>Excluir</button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: '#1a1414', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
  };

  const handleToggleBlockAffiliate = async (affiliate: any) => {
    const isBlocked = affiliate.status === 'blocked';
    const newStatus = isBlocked ? 'active' : 'blocked';
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', affiliate.id);

      if (error) throw error;

      toast.success(`Afiliado ${isBlocked ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
      // Refresh list
      const { data: updatedData } = await supabase.from('user_profiles').select('*').eq('organization_id', ORGANIZATION_ID);
      setAffiliates(updatedData || []);
    } catch (err: any) {
      toast.error("Erro ao alterar status: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('site_configs')
        .upsert({
          organization_id: ORGANIZATION_ID,
          shop_name: shopName,
          commission_type: commissionType,
          network_depth: networkDepth,
          level_commissions: levelCommissions,
          leadership_bonus_config: leadershipBonusConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id' });

      if (error) throw error;
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Status do pedido atualizado para ${newStatus}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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

  // Calculate stats from real data (Only COMPLETED orders for main revenue)
  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingOrders = orders.filter(o => o.status === 'pending');

  const totalRevenue = completedOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
  const totalCommissions = completedOrders.reduce((acc, order) => acc + (order.commission_amount || 0), 0);
  const pendingRevenue = pendingOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
  
  const affiliateRelatedRevenue = completedOrders
    .filter(o => o.referrer_id || o.affiliate_id)
    .reduce((acc, order) => acc + (order.total_amount || 0), 0);
  
  const averageTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const stats = [
    { label: 'Receita Confirmada', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <DollarSign className="w-5 h-5" />, trend: 'Liquidado', color: 'from-accent to-accent/50' },
    { label: 'Pedidos Pendentes', value: pendingOrders.length.toString(), icon: <ShoppingCart className="w-5 h-5" />, trend: `R$ ${pendingRevenue.toLocaleString('pt-BR')}`, color: 'from-yellow-500 to-yellow-400' },
    { label: 'Total Afiliados', value: affiliates.length.toString(), icon: <Users className="w-5 h-5" />, trend: 'Base', color: 'from-purple-500 to-purple-400' },
    { label: 'Ticket Médio', value: `R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <TrendingUp className="w-5 h-5" />, trend: 'Média', color: 'from-green-500 to-green-400' },
  ];

  const filteredAffiliates = affiliates.map(a => {
    const affiliateOrders = completedOrders.filter(o => o.affiliate_id === a.id || o.referrer_id === a.id);
    const calculatedSales = affiliateOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
    const calculatedCommission = affiliateOrders.reduce((acc, o) => acc + (o.commission_amount || 0), 0);
    return {
      ...a,
      total_sales: calculatedSales > 0 ? calculatedSales : (a.total_sales || 0),
      balance: calculatedCommission > 0 ? calculatedCommission : (a.balance || 0)
    };
  }).filter(a => 
    (a.email || "").toLowerCase().includes(affiliateSearch.toLowerCase()) ||
    (a.login || "").toLowerCase().includes(affiliateSearch.toLowerCase()) ||
    (a.nome || "").toLowerCase().includes(affiliateSearch.toLowerCase()) ||
    (a.full_name || "").toLowerCase().includes(affiliateSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    (p.name || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const categoryMap: Record<string, number> = {
    'Lingerie': 1,
    'Cosméticos': 2,
    'Casa': 3,
    'Acessórios': 4
  };

  const handleEditProduct = (product: any) => {
    setNewProduct({
      name: product.name || '',
      price: product.price?.toString() || '',
      stock: product.stock_quantity?.toString() || '0',
      description: product.description || '',
      image_url: product.image_url || '',
      category: Object.keys(categoryMap).find(key => categoryMap[key] === product.category_id) || 'Lingerie'
    });
    setEditingProductId(product.id);
    setShowNewProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error("Por favor, preencha nome e preço.");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = newProduct.image_url;

      // Se o usuário selecionou um arquivo local, fazemos o upload pro Supabase Storage
      if (selectedImageFile) {
        const fileExt = selectedImageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `product/${fileName}`;

        // Usando o bucket 'product-images' já existente e pasta 'product'
        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(filePath, selectedImageFile);

        if (uploadError) {
            console.error("Erro no upload da imagem:", uploadError);
            toast.error("Erro ao enviar a imagem. Verifique as permissões do bucket.");
        }

        if (data) {
             const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);
             finalImageUrl = publicUrl;
        }
      }

      const categoryId = categoryMap[newProduct.category] || 1;

      if (editingProductId) {
        // UPDATE
        const { error } = await supabase.from('products').update({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price.replace(',', '.')),
          stock_quantity: parseInt(newProduct.stock) || 0,
          image_url: finalImageUrl,
          category_id: categoryId,
        }).eq('id', editingProductId);

        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        // INSERT
        const { error } = await supabase.from('products').insert({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price.replace(',', '.')),
          stock_quantity: parseInt(newProduct.stock) || 0,
          image_url: finalImageUrl || 'https://images.unsplash.com/photo-1584305574647-0cb93d30b912?w=500&auto=format&fit=crop&q=60',
          category_id: categoryId,
          organization_id: ORGANIZATION_ID,
          is_active: true
        });

        if (error) throw error;
        toast.success("Produto criado com sucesso!");
      }
      
      setShowNewProductModal(false);
      setEditingProductId(null);
      setNewProduct({ name: '', price: '', stock: '', description: '', image_url: '', category: 'Lingerie' });
      setSelectedImageFile(null);
      // Refresh list
      const { data: updatedData } = await supabase.from('products').select('*').eq('organization_id', ORGANIZATION_ID).order('created_at', { ascending: false });
      setProducts(updatedData || []);
    } catch (err: any) {
      toast.error("Erro ao salvar produto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Certeza que deseja excluir este produto? Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-2">
          <button 
            className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button 
            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={async () => {
              toast.dismiss(t.id);
              setLoading(true);
              try {
                const { data, error } = await supabase
                  .from('products')
                  .delete()
                  .eq('id', productId)
                  .select();

                if (error) throw error;
                if (!data || data.length === 0) {
                  throw new Error("Produto não excluiu. RLS bloqueado ou erro de banco de dados.");
                }

                toast.success("Produto excluído com sucesso!");
                const { data: updatedData } = await supabase
                  .from('products')
                  .select('*')
                  .eq('organization_id', ORGANIZATION_ID)
                  .order('created_at', { ascending: false });
                setProducts(updatedData || []);
              } catch (err: any) {
                toast.error("Erro ao excluir produto: " + err.message);
              } finally {
                setLoading(false);
              }
            }}>Excluir</button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: '#1a1414', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
  };

  const handleToggleVisibility = async (product: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(`Produto ${!product.is_active ? 'ativado' : 'ocultado'} com sucesso!`);
      // Refresh list
      const { data: updatedData } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', ORGANIZATION_ID)
        .order('created_at', { ascending: false });
      setProducts(updatedData || []);
    } catch (err: any) {
      toast.error("Erro ao atualizar visibilidade: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#130d0d] text-white overflow-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
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
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-accent text-primary font-bold shadow-lg shadow-accent/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <ShoppingCart className={`w-5 h-5 ${activeTab === 'orders' ? 'animate-pulse' : ''}`} />
              <span className="text-xs uppercase tracking-widest">Pedidos</span>
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
                       {orders.slice(0, 5).length > 0 ? (
                         orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex justify-between items-center p-4 bg-[#130d0d] rounded-2xl border border-white/5">
                            <div>
                              <p className="text-sm font-medium text-white">Pedido #{order.id.substring(0, 6)}</p>
                              <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <span className="text-accent font-medium">R$ {order.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))
                       ) : (
                         <p className="text-center text-slate-500 py-10">Nenhum pedido encontrado.</p>
                       )}
                     </div>
                   </div>
                   <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Avisos do Sistema</h3>
                     <div className="space-y-4">
                        {products.filter(p => p.stock_quantity < 5).map(p => (
                          <div key={p.id} className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                            <p className="text-sm text-accent font-medium">Estoque Baixo</p>
                            <p className="text-xs text-slate-400 mt-1">{p.name} resta(m) apenas {p.stock_quantity} unidades.</p>
                          </div>
                        ))}
                        {affiliates.filter(a => a.status === 'pending').length > 0 && (
                          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                            <p className="text-sm text-blue-400 font-medium">Novos Cadastros</p>
                            <p className="text-xs text-slate-400 mt-1">{affiliates.filter(a => a.status === 'pending').length} novas consultoras aguardam aprovação.</p>
                          </div>
                        )}
                        {products.filter(p => p.stock_quantity < 5).length === 0 && affiliates.filter(a => a.status === 'pending').length === 0 && (
                          <p className="text-center text-slate-500 py-10 italic">Tudo sob controle no momento.</p>
                        )}
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
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Buscar produto pelo nome..." 
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="bg-[#1a1414] border border-accent/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent w-64"
                      />
                   </div>
                   <button 
                     onClick={() => {
                        setEditingProductId(null);
                        setNewProduct({ name: '', price: '', stock: '', description: '', image_url: '', category: 'Lingerie' });
                        setShowNewProductModal(true);
                      }}
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
                      {filteredProducts.map((p) => (
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
                          <td className="p-4">
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleEditProduct(p)}
                                className="text-accent hover:text-white transition-colors"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleVisibility(p)}
                                className={`${p.is_active ? 'text-slate-400 hover:text-white' : 'text-yellow-500 hover:text-yellow-400'} transition-colors`}
                                title={p.is_active ? "Ocultar da Loja" : "Mostrar na Loja"}
                              >
                                {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(p.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Excluir Produto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
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
                      <p className="text-2xl font-serif text-white">{affiliates.length}</p>
                    </div>
                  </div>
                  <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Faturamento (Indicações)</p>
                      <p className="text-2xl font-serif text-white text-green-400">R$ {affiliateRelatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Comissões a Pagar</p>
                      <p className="text-2xl font-serif text-white text-accent">R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Patente</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Faturamento</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Saldo</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAffiliates.map((a) => (
                        <tr key={a.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-sm text-white">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{a.email?.split('@')[0] || 'Afiliado'}</span>
                                {a.status === 'blocked' && (
                                  <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Bloqueado</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">ID: #{a.id.substring(0, 8)}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-accent font-bold">{a.rank || 'Consultor'}</td>
                          <td className="p-4 text-sm text-white">R$ {(a.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-sm font-bold text-green-400">R$ {a.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
                             
                             <button 
                               onClick={() => handleToggleBlockAffiliate(a)}
                               className={`${a.status === 'blocked' ? 'text-green-400 hover:text-green-300' : 'text-yellow-500 hover:text-yellow-400'} transition-colors`}
                               title={a.status === 'blocked' ? "Desbloquear Afiliado" : "Bloquear Afiliado"}
                             >
                               {a.status === 'blocked' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                             </button>

                             <button 
                               onClick={() => handleDeleteAffiliate(a.id)}
                               className="text-red-400 hover:text-red-300 transition-colors"
                               title="Excluir Afiliado"
                             >
                               <Trash2 className="w-4 h-4" />
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
                       <input 
                         type="text" 
                         value={shopName}
                         onChange={(e) => setShopName(e.target.value)}
                         className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" 
                       />
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
                 </div>

                {/* Leadership Bonus Config */}
                <div className="bg-[#1a1414] border border-accent/10 rounded-3xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <h3 className="text-lg font-serif text-white">Configuração de Patentes (Bônus de Liderança)</h3>
                    <button 
                      onClick={() => setLeadershipBonusConfig([...leadershipBonusConfig, { name: 'Nova Patente', threshold: 0, percentage: 1 }])}
                      className="text-accent hover:text-white transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Nível
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400">Defina o faturamento necessário e o percentual de bônus extra para cada patente.</p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {leadershipBonusConfig.map((item, idx) => (
                        <div key={idx} className="bg-[#130d0d] border border-white/5 p-4 rounded-2xl flex flex-wrap items-center gap-4">
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Nome da Patente</label>
                            <input 
                              type="text" 
                              value={item.name}
                              onChange={(e) => {
                                const newConfig = [...leadershipBonusConfig];
                                newConfig[idx].name = e.target.value;
                                setLeadershipBonusConfig(newConfig);
                              }}
                              className="w-full bg-transparent border-b border-white/10 text-white focus:border-accent outline-none font-medium text-sm" 
                            />
                          </div>
                          
                          <div className="w-32">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Faturamento (R$)</label>
                            <input 
                              type="number" 
                              value={item.threshold}
                              onChange={(e) => {
                                const newConfig = [...leadershipBonusConfig];
                                newConfig[idx].threshold = parseFloat(e.target.value) || 0;
                                setLeadershipBonusConfig(newConfig);
                              }}
                              className="w-full bg-transparent border-b border-white/10 text-white focus:border-accent outline-none font-medium text-sm" 
                            />
                          </div>
                          
                          <div className="w-24">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Bônus (%)</label>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                value={item.percentage}
                                onChange={(e) => {
                                  const newConfig = [...leadershipBonusConfig];
                                  newConfig[idx].percentage = parseFloat(e.target.value) || 0;
                                  setLeadershipBonusConfig(newConfig);
                                }}
                                className="w-full bg-transparent border-b border-white/10 text-white focus:border-accent outline-none font-medium text-sm text-right" 
                              />
                              <span className="text-slate-500">%</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setLeadershipBonusConfig(leadershipBonusConfig.filter((_, i) => i !== idx))}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="w-full md:w-auto bg-accent text-primary px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Todas as Configurações'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-serif text-white mb-2">Pedidos da Loja</h2>
                    <p className="text-slate-400 text-sm italic">Gerencie todas as vendas e o status de entrega.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Buscar por ID ou Email..." 
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="bg-[#1a1414] border border-white/10 rounded-xl py-3 pl-12 pr-6 text-sm text-white focus:border-accent outline-none w-full md:w-80 transition-all font-medium" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1414] border border-accent/10 rounded-[40px] overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#130d0d] border-b border-accent/10">
                        <tr>
                          <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">ID Pedido</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Valor Total</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {orders.filter(o => 
                          o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.payment_id?.toString().includes(orderSearch)
                        ).map((order) => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4">
                              <span className="text-sm font-bold text-white">#{order.payment_id || order.id.substring(0, 8)}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-sm text-white">{order.email?.split('@')[0] || 'Cliente'}</span>
                                <span className="text-[10px] text-slate-500">{order.email}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm font-bold text-accent">
                               R$ {order.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                                order.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-red-500/10 text-red-400'
                              }`}>
                                {order.status === 'completed' ? 'Concluído' : 
                                 order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="p-4 text-right flex items-center justify-end gap-2">
                              {order.status === 'pending' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateOrderStatus(order.id, 'completed');
                                  }}
                                  className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-green-500/20"
                                >
                                  Aprovar
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderModal(true);
                                }}
                                className="bg-accent/10 text-accent hover:bg-accent hover:text-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                              >
                                Ver Detalhes
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
              className="bg-[#1a1414] border border-accent/20 rounded-3xl p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setShowNewProductModal(false);
                  setEditingProductId(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-serif text-white mb-2">
                  {editingProductId ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {editingProductId ? 'Atualize os detalhes do produto cadastrado.' : 'Preencha os detalhes para cadastrar na boutique.'}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Nome do Produto</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Batom Matte Vermelho" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Preço (R$)</label>
                    <input 
                      type="text" 
                      placeholder="0,00" 
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Estoque Inicial</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={newProduct.stock}
                      onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                      className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Categoria</label>
                    <select 
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none appearance-none"
                    >
                      <option value="Lingerie">Lingerie</option>
                      <option value="Cosméticos">Cosméticos</option>
                      <option value="Acessórios">Acessórios</option>
                      <option value="Perfumaria">Perfumaria</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Imagem do Produto</label>
                    <div className="flex gap-2">
                      <label className="flex-1 bg-[#130d0d] border border-white/10 rounded-xl p-3 text-slate-400 hover:border-accent transition-colors cursor-pointer flex items-center justify-between group">
                        <span className="truncate text-xs">{selectedImageFile ? selectedImageFile.name : 'Procurar no computador...'}</span>
                        <Upload className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedImageFile(e.target.files[0]);
                              setNewProduct({...newProduct, image_url: ''}); // Clear URL if file selected
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="mt-2">
                       <label className="text-[10px] text-slate-500 uppercase tracking-widest">Ou insira uma URL externa:</label>
                       <input 
                          type="text" 
                          placeholder="https://..." 
                          value={newProduct.image_url}
                          onChange={e => {
                              setNewProduct({...newProduct, image_url: e.target.value});
                              if(e.target.value) setSelectedImageFile(null); // Clear file if URL is typed
                          }}
                          className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-xs mt-1" 
                        />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Descrição Completa</label>
                  <textarea 
                    rows={4}
                    placeholder="Descreva as características do produto..." 
                    value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full bg-[#130d0d] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none resize-none" 
                  />
                </div>

                <button 
                  onClick={handleSaveProduct}
                  disabled={loading}
                  className="w-full bg-accent text-primary py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent/90 transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                    {editingProductId ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto Real'}
                  </>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
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
              className="bg-[#1a1414] border border-accent/20 rounded-3xl p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowOrderModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                   <h3 className="text-2xl font-serif text-white">Pedido #{selectedOrder.payment_id || selectedOrder.id.substring(0, 8)}</h3>
                   <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      selectedOrder.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      selectedOrder.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {selectedOrder.status}
                    </span>
                </div>
                <p className="text-slate-400 text-sm">Realizado em {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <div className="space-y-6">
                <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5 space-y-4">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">Cliente</h4>
                   <div className="flex justify-between items-center">
                      <span className="text-sm text-white">{selectedOrder.nome || 'Cliente'}</span>
                      <span className="text-xs text-slate-400">{selectedOrder.email}</span>
                   </div>
                   {selectedOrder.whatsapp && (
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter">WhatsApp</span>
                        <span className="text-xs text-white">{selectedOrder.whatsapp}</span>
                     </div>
                   )}
                </div>

                <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5 space-y-4">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">Itens do Pedido</h4>
                   <div className="space-y-2">
                      {selectedOrder.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                           <span className="text-white">{item.quantity}x {item.title || item.name}</span>
                           <span className="text-accent">R$ {(item.unit_price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      {!selectedOrder.items && (
                        <p className="text-xs text-slate-500 italic">Detalhes dos itens não disponíveis.</p>
                      )}
                   </div>
                   <div className="pt-2 border-t border-white/5 flex justify-between font-serif text-lg">
                      <span className="text-white">Total</span>
                      <span className="text-accent font-bold">R$ {selectedOrder.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>

                <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5 space-y-4">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">Status do Pedido</h4>
                   <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          selectedOrder.status === 'completed' ? 'bg-green-500 text-white cursor-default' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white'
                        }`}
                      >
                        {selectedOrder.status === 'completed' ? 'Pagamento Confirmado' : 'Confirmar Pagamento (WhatsApp)'}
                      </button>
                      <button 
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'pending')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          selectedOrder.status === 'pending' ? 'bg-yellow-500 text-primary cursor-default' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white'
                        }`}
                      >
                        Marcar como Pendente
                      </button>
                      <button 
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'canceled')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          selectedOrder.status === 'canceled' ? 'bg-red-500 text-white cursor-default' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        Cancelar Pedido
                      </button>
                   </div>
                </div>
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
                    <h3 className="text-2xl font-serif text-white">{selectedAffiliate.login || selectedAffiliate.email?.split('@')[0] || 'Afiliado'}</h3>
                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded font-bold uppercase tracking-widest">{selectedAffiliate.rank || 'Consultor'}</span>
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
                        <p className="text-2xl font-serif text-accent">R$ {(selectedAffiliate.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Recebido</p>
                        <p className="text-2xl font-serif text-white">R$ {(selectedAffiliate.total_earnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Faturamento Total</p>
                        <p className="text-2xl font-serif text-white">R$ {(selectedAffiliate.total_sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-[#130d0d] p-6 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Bônus de Liderança</p>
                        <p className="text-2xl font-serif text-green-400">R$ {(selectedAffiliate.leadership_bonus_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-accent/5 border border-accent/20 rounded-2xl">
                      <div>
                        <h4 className="text-accent font-bold uppercase text-xs tracking-widest mb-1">Liquidar Comissão</h4>
                        <p className="text-xs text-slate-400">Clique para confirmar que o pagamento de R$ {(selectedAffiliate.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi realizado via PIX/Transferência.</p>
                      </div>
                      <button 
                        onClick={() => {
                          const affiliateName = selectedAffiliate.login || selectedAffiliate.email?.split('@')[0] || 'Afiliado';
                          toast.success(`Pagamento de R$ ${selectedAffiliate.balance || 0} confirmado para ${affiliateName}!`);
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
                            <td className="p-4 text-xs text-white">{sale.email?.split('@')[0] || 'Cliente'}</td>
                            <td className="p-4 text-xs text-white">R$ {sale.total_amount?.toFixed(2)}</td>
                            <td className="p-4 text-xs text-accent font-bold">R$ {(sale.commission_amount || 0).toFixed(2)}</td>
                            <td className="p-4">
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${sale.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {sale.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {orders.filter(o => o.referrer_id === selectedAffiliate.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500 italic">Nenhum pedido vinculado a este afiliado.</td>
                          </tr>
                        )}
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
