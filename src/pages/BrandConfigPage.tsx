/**
 * Página de Configuração de Marca
 * 
 * Página administrativa para gerenciar facilmente todas as configurações
 * relacionadas ao nome da aplicação e marca.
 */

import React from 'react';
import { BrandConfigManager } from '@/components/admin/BrandConfigManager';

export const BrandConfigPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <BrandConfigManager />
    </div>
  );
};

export default BrandConfigPage;