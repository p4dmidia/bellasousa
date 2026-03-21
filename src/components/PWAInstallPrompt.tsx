import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Check if user has already seen this or dismissed it in this session
      const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:w-96"
      >
        <div className="bg-[#1a1414] border border-accent/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-accent/20 transition-all duration-700" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex gap-4 items-start relative z-10">
            <div className="p-3 bg-accent/10 rounded-2xl text-accent">
              <Smartphone className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-serif text-lg mb-1">Bella Sousa no seu Celular</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Instale nosso aplicativo para uma experiência mais rápida, imersiva e acesso exclusivo.
              </p>
              
              <button
                onClick={handleInstall}
                className="w-full bg-accent text-primary font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-accent/90 shadow-lg shadow-accent/20"
              >
                <Download className="w-4 h-4" />
                Instalar App Agora
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
