import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface HelpContent {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'advanced' | 'tutorial' | 'faq' | 'tips';
  tags: string[];
  icon?: string;
  videoUrl?: string;
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
  hasSeenOnboarding: boolean;
}

export const useHelpSystem = () => {
  const location = useLocation();
  
  const [state, setState] = useState<HelpState>({
    isOpen: false,
    currentContent: null,
    searchQuery: '',
    activeCategory: null,
    showTutorial: false,
    tutorialStep: 0,
    hasSeenOnboarding: false
  });

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('help-system-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setState(prev => ({
        ...prev,
        hasSeenOnboarding: parsed.hasSeenOnboarding || false
      }));
    }
  }, []);

  // Salvar configurações no localStorage
  const saveSettings = useCallback((settings: Partial<HelpState>) => {
    const current = JSON.parse(localStorage.getItem('help-system-settings') || '{}');
    const updated = { ...current, ...settings };
    localStorage.setItem('help-system-settings', JSON.stringify(updated));
  }, []);

  const openHelp = useCallback((content?: HelpContent) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      currentContent: content || null
    }));
  }, []);

  const closeHelp = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      currentContent: null,
      showTutorial: false
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

  const markOnboardingComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasSeenOnboarding: true
    }));
    saveSettings({ hasSeenOnboarding: true });
  }, [saveSettings]);

  const getContextualHelp = useCallback(() => {
    const path = location.pathname;
    
    // Retornar conteúdo de ajuda baseado na rota atual
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
  }, [location.pathname]);

  return {
    ...state,
    openHelp,
    closeHelp,
    setSearchQuery,
    setActiveCategory,
    startTutorial,
    nextTutorialStep,
    prevTutorialStep,
    finishTutorial,
    markOnboardingComplete,
    getContextualHelp
  };
};