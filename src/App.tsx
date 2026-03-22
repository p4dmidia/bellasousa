import Header from './components/Header';
import Hero from './components/Hero';
import Collections from './components/Collections';
import FeaturedProducts from './components/FeaturedProducts';
import Store from './components/Store';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import { Affiliate } from './components/Affiliate';
import { Login } from './components/Login';
import Footer from './components/Footer';
import ProductDetail from './components/ProductDetail';
import Dashboard from './components/Dashboard';
import { AdminLogin } from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useState, useEffect } from 'react';
import { captureReferral } from './lib/referral';
import { motion, AnimatePresence } from 'motion/react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

export default function App() {
  const [view, setView] = useState<'home' | 'store' | 'product' | 'cart' | 'checkout' | 'affiliate' | 'login' | 'dashboard' | 'admin-login' | 'admin-dashboard'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    // 1. Capture referral code and clean URL (30-day persistence)
    captureReferral();

    // 2. Handle sub-paths (alternative to hash router)
    const path = window.location.pathname;
    if (path === '/loja') {
      setView('store');
    } else if (path === '/cadastro') {
      setView('affiliate');
    } else if (path === '/login') {
      setView('login');
    } else if (path === '/admin') {
      setView('admin-login');
    } else if (window.location.hash === '#admin') {
      setView('admin-login');
    }
  }, []);

  const navigateToStore = (category?: string) => {
    if (category) setFilterCategory(category);
    setSearchQuery(""); // Limpa a busca ao navegar por categoria
    setView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProduct = (product: any) => {
    setSelectedProduct(product);
    setView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product: any) => {
    const normalizedProduct = {
      ...product,
      image: product.image_url || product.image
    };

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...normalizedProduct, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      {view !== 'dashboard' && view !== 'admin-dashboard' && view !== 'admin-login' && (
        <Header
          onNavigate={(v, cat) => v === 'store' ? navigateToStore(cat) : setView(v === 'admin' ? 'admin-login' : v)}
          cartCount={cartCount}
          onOpenCart={() => setView('cart')}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (view !== 'store') setView('store');
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Hero onNavigate={(v, cat) => navigateToStore(cat)} />
            <Footer />
          </motion.div>
        )}

        {view === 'store' && (
          <motion.div
            key="store"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Store
              onAddToCart={(p) => addToCart(p)}
              onProductClick={(p) => openProduct(p)}
              initialCategory={filterCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <Footer />
          </motion.div>
        )}

        {view === 'product' && (
          <motion.div
            key="product"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <ProductDetail
              product={selectedProduct}
              onBack={() => setView('store')}
              onAddToCart={() => addToCart(selectedProduct)}
            />
            <Footer />
          </motion.div>
        )}

        {view === 'cart' && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Cart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onBackToStore={() => setView('store')}
              onProceedToCheckout={() => setView('checkout')}
            />
            <Footer />
          </motion.div>
        )}

        {view === 'checkout' && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <Checkout
              items={cart}
              onBackToCart={() => setView('cart')}
              onFinish={() => {
                setCart([]);
                setView('home');
              }}
            />
            <Footer />
          </motion.div>
        )}

        {view === 'affiliate' && (
          <motion.div
            key="affiliate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Affiliate 
              onBack={() => setView('home')} 
              onSuccess={() => setView('login')} 
              onLoginSuccess={() => {
                setIsLoggedIn(true);
                setView('dashboard');
              }}
            />
            <Footer />
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <Login 
              onBack={() => setView('home')} 
              onSwitchToRegister={() => setView('affiliate')} 
              onLoginSuccess={() => {
                setIsLoggedIn(true);
                setView('dashboard');
              }}
            />
            <Footer />
          </motion.div>
        )}

        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <Dashboard 
              onLogout={() => {
                setIsLoggedIn(false);
                setView('home');
              }} 
              onNavigateHome={() => setView('home')}
            />
          </motion.div>
        )}

        {view === 'admin-login' && (
          <motion.div
            key="admin-login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex"
          >
            <AdminLogin 
              onBack={() => setView('home')} 
              onLoginSuccess={() => {
                setIsAdminLoggedIn(true);
                setView('admin-dashboard');
              }}
            />
          </motion.div>
        )}

        {view === 'admin-dashboard' && (
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <AdminDashboard 
              onLogout={() => {
                setIsAdminLoggedIn(false);
                setView('home');
              }} 
              onNavigateHome={() => setView('home')}
            />
          </motion.div>
        )}

      </AnimatePresence>
      <PWAInstallPrompt />
    </div>
  );
}
