
import { useState, useMemo, useCallback } from 'react';

export const useBudgetSearch = (budgets: any[] = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actualSearchTerm, setActualSearchTerm] = useState('');

  const filteredBudgets = useMemo(() => {
    if (!actualSearchTerm.trim()) return budgets;
    
    const term = actualSearchTerm.toLowerCase();
    return budgets.filter(budget => {
      try {
        const clientName = budget?.client_name;
        const deviceModel = budget?.device_model;
        const issue = budget?.issue;
        
        const clientMatch = clientName && typeof clientName === 'string' 
          ? clientName.toLowerCase().includes(term) 
          : false;
        const deviceMatch = deviceModel && typeof deviceModel === 'string' 
          ? deviceModel.toLowerCase().includes(term) 
          : false;
        const issueMatch = issue && typeof issue === 'string' 
          ? issue.toLowerCase().includes(term) 
          : false;
          
        return clientMatch || deviceMatch || issueMatch;
      } catch (error) {
        console.warn('Search filter error:', error);
        return false;
      }
    });
  }, [budgets, actualSearchTerm]);

  const handleSearch = useCallback(() => {
    setActualSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setActualSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    actualSearchTerm,
    filteredBudgets,
    handleSearch,
    handleKeyPress,
    clearSearch,
    hasActiveSearch: !!actualSearchTerm.trim()
  };
};
