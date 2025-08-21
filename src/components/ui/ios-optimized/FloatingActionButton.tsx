
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Settings, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  className?: string;
}

export const FloatingActionButton = ({
  actions,
  className = ""
}: FloatingActionButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (action: FABAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  const fabVariants = {
    expanded: { rotate: 45 },
    collapsed: { rotate: 0 }
  };

  const menuVariants = {
    expanded: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    collapsed: {
      opacity: 0,
      scale: 0.8,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    expanded: {
      y: 0,
      opacity: 1,
      scale: 1
    },
    collapsed: {
      y: 20,
      opacity: 0,
      scale: 0.8
    }
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Action Menu */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={menuVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="absolute bottom-16 right-0 flex flex-col gap-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                variants={itemVariants}
                className="flex items-center gap-3"
              >
                {/* Label */}
                <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 shadow-lg">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {action.label}
                  </span>
                </div>
                
                {/* Action Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleActionClick(action)}
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg transition-colors",
                    "flex items-center justify-center",
                    action.color || "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  style={{ touchAction: 'manipulation' }}
                >
                  <action.icon className="h-5 w-5" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        variants={fabVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
        whileTap={{ scale: 0.9 }}
        onClick={toggleExpanded}
        className={cn(
          "w-14 h-14 bg-primary text-primary-foreground rounded-full",
          "shadow-xl hover:shadow-2xl transition-shadow duration-300",
          "flex items-center justify-center",
          "hover:bg-primary/90 active:bg-primary/80"
        )}
        style={{ touchAction: 'manipulation' }}
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

// Predefined actions for common use cases
export const createDefaultFABActions = (callbacks: {
  onNewBudget?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
  onSettings?: () => void;
  onClients?: () => void;
}): FABAction[] => [
  {
    id: 'new-budget',
    label: 'Novo Orçamento',
    icon: FileText,
    onClick: callbacks.onNewBudget || (() => {}),
    color: 'bg-blue-600 text-white hover:bg-blue-700'
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: Users,
    onClick: callbacks.onClients || (() => {}),
    color: 'bg-green-600 text-white hover:bg-green-700'
  },
  {
    id: 'search',
    label: 'Buscar',
    icon: Search,
    onClick: callbacks.onSearch || (() => {}),
    color: 'bg-purple-600 text-white hover:bg-purple-700'
  },
  {
    id: 'filter',
    label: 'Filtros',
    icon: Filter,
    onClick: callbacks.onFilter || (() => {}),
    color: 'bg-orange-600 text-white hover:bg-orange-700'
  }
];
