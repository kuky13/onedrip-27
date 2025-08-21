import { useState, useCallback, useEffect } from 'react';
import { useIOSOptimization } from './useIOSOptimization';

export interface HelpContent {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'advanced' | 'tutorial' | 'faq' | 'tips';
  tags: string[];
  icon?: string;
  steps?: Array<{
    title: string;
    description: string;
    target?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }>;
}

export interface HelpState {
  isOpen: boolean;
  currentContent: HelpContent | null;
  searchQuery: string;
  activeCategory: string | null;
  showTutorial: boolean;
  tutorialStep: number;
  showFeedback: boolean;
  hasSeenOnboarding: boolean;
}

export const useIOSHelpSystem = () => {
  const { isIOS } = useIOSOptimization();
  
  const [state, setState] = useState<HelpState>({
    isOpen: false,
    currentContent: null,
    searchQuery: '',
    activeCategory: null,
    showTutorial: false,
    tutorialStep: 0,
    showFeedback: false,
    hasSeenOnboarding: false
  });

  // Carregar configurações do localStorage de forma otimizada para iOS
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('ios-help-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setState(prev => ({
          ...prev,
          hasSeenOnboarding: parsed.hasSeenOnboarding || false
        }));
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de ajuda:', error);
    }
  }, []);

  // Salvar configurações de forma otimizada
  const saveSettings = useCallback((settings: Partial<HelpState>) => {
    try {
      const current = JSON.parse(localStorage.getItem('ios-help-settings') || '{}');
      const updated = { ...current, ...settings };
      localStorage.setItem('ios-help-settings', JSON.stringify(updated));
    } catch (error) {
      console.warn('Erro ao salvar configurações de ajuda:', error);
    }
  }, []);

  const openHelp = useCallback((content?: HelpContent) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      currentContent: content || null,
      showFeedback: false
    }));
  }, []);

  const closeHelp = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      currentContent: null,
      showTutorial: false,
      showFeedback: false
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  const setActiveCategory = useCallback((category: string | null) => {
    setState(prev => ({
      ...prev,
      activeCategory: category
    }));
  }, []);

  const startTutorial = useCallback((content?: HelpContent) => {
    setState(prev => ({
      ...prev,
      showTutorial: true,
      tutorialStep: 0,
      currentContent: content || null,
      isOpen: false
    }));
  }, []);

  const nextTutorialStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      tutorialStep: prev.tutorialStep + 1
    }));
  }, []);

  const prevTutorialStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      tutorialStep: Math.max(0, prev.tutorialStep - 1)
    }));
  }, []);

  const finishTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      showTutorial: false,
      tutorialStep: 0,
      currentContent: null
    }));
  }, []);

  const showFeedbackForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      showFeedback: true
    }));
  }, []);

  const hideFeedbackForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      showFeedback: false
    }));
  }, []);

  const markOnboardingComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasSeenOnboarding: true
    }));
    saveSettings({ hasSeenOnboarding: true });
  }, [saveSettings]);

  // Contexto baseado na URL atual (otimizado para iOS)
  const getContextualHelp = useCallback(() => {
    const path = window.location.pathname;
    
    switch (path) {
      case '/painel':
        return 'dashboard';
      case '/orcamentos':
        return 'budgets';
      case '/novo-orcamento':
        return 'new-budget';
      case '/clientes':
        return 'clients';
      case '/configuracoes':
        return 'settings';
      default:
        return 'general';
    }
  }, []);

  // Limpar busca quando necessário (otimização iOS)
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  return {
    ...state,
    isIOS,
    openHelp,
    closeHelp,
    setSearchQuery,
    clearSearch,
    setActiveCategory,
    startTutorial,
    nextTutorialStep,
    prevTutorialStep,
    finishTutorial,
    showFeedbackForm,
    hideFeedbackForm,
    markOnboardingComplete,
    getContextualHelp
  };
};