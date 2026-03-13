import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users } from 'lucide-react';

export interface AffiliateNode {
  id: string;
  name: string;
  level: string;
  pts: string;
  image?: string;
  children?: AffiliateNode[];
}

export const initialNetworkData: AffiliateNode = {
  id: "BS-001",
  name: "Maria Silva",
  level: "Líder Esmeralda",
  pts: "12.400",
  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop",
  children: [
    {
      id: "BS-102",
      name: "Geheka Lima",
      level: "Ouro",
      pts: "4.800",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop",
      children: [
        { id: "BS-201", name: "No User", level: "-", pts: "0" },
        { id: "BS-202", name: "No User", level: "-", pts: "0" }
      ]
    },
    {
      id: "BS-103",
      name: "Absmedia Sales",
      level: "Ouro",
      pts: "5.100",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&auto=format&fit=crop",
      children: [
        { id: "BS-203", name: "No User", level: "-", pts: "0" },
        {
          id: "BS-204",
          name: "Kienzkie",
          level: "Pérola",
          pts: "2.450",
          image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&auto=format&fit=crop",
          children: [
             { id: "BS-301", name: "No User", level: "-", pts: "0" },
             { 
               id: "BS-302", 
               name: "Username4", 
               level: "Consultora", 
               pts: "850", 
               image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&h=150&auto=format&fit=crop" 
             }
          ]
        }
      ]
    }
  ]
};

export function TreeNode({ node, isLast = false }: { node: AffiliateNode; isLast?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isNoUser = node.name === "No User";

  return (
    <div className="flex flex-col items-center relative">
      <div className="flex flex-col items-center z-10">
        <motion.div
           whileHover={{ scale: 1.1 }}
           onClick={() => {
             if (isNoUser) return;
             setIsExpanded(!isExpanded);
             setShowDetails(!showDetails);
           }}
           className="relative cursor-pointer group"
        >
          <div className={`w-16 h-16 rounded-full border-4 ${isNoUser ? 'border-slate-700 bg-slate-800' : 'border-accent bg-primary'} p-0.5 shadow-xl transition-all`}>
            {isNoUser ? (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-white/5">
                <Users className="w-6 h-6 text-slate-600" />
              </div>
            ) : (
              <img 
                src={node.image || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=150&h=150&auto=format&fit=crop"} 
                alt={node.name} 
                className="w-full h-full object-cover rounded-full"
              />
            )}
          </div>
          
          <AnimatePresence>
            {showDetails && !isNoUser && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 bg-[#251212] border border-accent/30 p-4 rounded-2xl shadow-2xl z-50 text-center"
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#251212] border-t border-l border-accent/30 rotate-45" />
                <p className="font-serif text-accent text-lg leading-tight mb-1">{node.name}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">{node.level}</p>
                <div className="space-y-1 text-[10px] text-slate-500 border-t border-white/5 pt-2">
                  <p>ID: <span className="text-white">{node.id}</span></p>
                  <p>Volume: <span className="text-accent">{node.pts} pts</span></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {node.name}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex gap-12 mt-12 relative">
          <div className="absolute top-0 left-[50%] -translate-x-1/2 w-full h-[1px] bg-accent/20" 
               style={{ width: `calc(100% - 64px)` }}
          />
          
          {node.children?.map((child, idx) => (
            <div key={child.id} className="relative pt-8">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-8 bg-accent/20" />
               <TreeNode node={child} isLast={idx === (node.children?.length || 0) - 1} />
            </div>
          ))}
        </div>
      )}
      
      {hasChildren && isExpanded && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[1px] h-12 bg-accent/20" />
      )}
    </div>
  );
}
