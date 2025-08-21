import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsProps {
  shortcuts: ShortcutConfig[];
  isEnabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, isEnabled = true }: UseKeyboardShortcutsProps) => {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;

    // Não executar atalhos se o usuário estiver digitando em um input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;

      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts, isEnabled]);

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isEnabled]);

  // Atalhos padrão do sistema
  const getDefaultShortcuts = useCallback((onOpenCommandPalette?: () => void): ShortcutConfig[] => [
    {
      key: 'n',
      ctrlKey: true,
      action: () => navigate('/painel', { state: { activeTab: 'new-budget' } }),
      description: 'Criar novo orçamento'
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => navigate('/'),
      description: 'Voltar ao dashboard principal'
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => onOpenCommandPalette?.(),
      description: 'Abrir busca rápida global'
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        // Abrir central de ajuda
        const helpDialog = document.querySelector('[data-help-dialog]') as HTMLElement;
        helpDialog?.click();
      },
      description: 'Ajuda'
    },
    {
      key: 'Escape',
      action: () => {
        // Fechar modais/overlays
        const closeButtons = document.querySelectorAll('[data-close-modal], [data-dialog-close]');
        const lastCloseButton = closeButtons[closeButtons.length - 1] as HTMLElement;
        lastCloseButton?.click();
      },
      description: 'Fechar modais/overlays'
    },
    // Atalhos numéricos para QuickAccess
    {
      key: '1',
      action: () => {
        const quickAccessButton = document.querySelector('[data-quick-access="1"]') as HTMLElement;
        quickAccessButton?.click();
      },
      description: 'Acesso rápido 1 - Novo Orçamento'
    },
    {
      key: '2',
      action: () => {
        const quickAccessButton = document.querySelector('[data-quick-access="2"]') as HTMLElement;
        quickAccessButton?.click();
      },
      description: 'Acesso rápido 2 - Ver Orçamentos'
    },
    {
      key: '3',
      action: () => {
        const quickAccessButton = document.querySelector('[data-quick-access="3"]') as HTMLElement;
        quickAccessButton?.click();
      },
      description: 'Acesso rápido 3 - Gestão de Dados'
    },
    {
      key: '4',
      action: () => {
        const quickAccessButton = document.querySelector('[data-quick-access="4"]') as HTMLElement;
        quickAccessButton?.click();
      },
      description: 'Acesso rápido 4 - Configurações'
    },
    {
      key: '5',
      action: () => {
        const quickAccessButton = document.querySelector('[data-quick-access="5"]') as HTMLElement;
        quickAccessButton?.click();
      },
      description: 'Acesso rápido 5 - Painel Admin'
    }
  ], [navigate]);

  return {
    getDefaultShortcuts
  };
};

export default useKeyboardShortcuts;