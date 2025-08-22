/**
 * Dashboard Demo - OneDrip
 * Demonstração das melhorias implementadas no design system
 */

import React from 'react';
import { EnhancedDashboard } from '@/components/dashboard/EnhancedDashboard';
import { ModernDashboard } from '@/components/dashboard/ModernDashboard';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { GlassCard } from '@/components/ui/modern-cards';
import { FadeInUp } from '@/components/ui/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Smartphone, 
  Zap, 
  Eye,
  Code,
  Sparkles
} from 'lucide-react';

export const DashboardDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = React.useState<'enhanced' | 'modern'>('enhanced');

  const improvements = [
    {
      icon: Palette,
      title: 'Design System Consistente',
      description: 'Tokens de design centralizados, tipografia padronizada e cores harmoniosas',
      color: 'blue'
    },
    {
      icon: Zap,
      title: 'Microinterações',
      description: 'Animações suaves, hover effects e transições que melhoram a experiência',
      color: 'green'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First',
      description: 'Bottom navigation, gestos touch e otimizações específicas para dispositivos móveis',
      color: 'purple'
    },
    {
      icon: Eye,
      title: 'Hierarquia Visual',
      description: 'Cards modernos com glassmorphism, shadows premium e layout mais limpo',
      color: 'yellow'
    },
    {
      icon: Sparkles,
      title: 'Notificações Ricas',
      description: 'Sistema de notificações interativo com ações e categorização',
      color: 'red'
    },
    {
      icon: Code,
      title: 'Componentes Reutilizáveis',
      description: 'Biblioteca de componentes moderna e escalável para desenvolvimento ágil',
      color: 'indigo'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header da Demo */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <FadeInUp>
            <div className="text-center space-y-4">
              <Heading level="h1" size="4xl" gradient className="mb-2">
                OneDrip Design System 2.0
              </Heading>
              <Text size="xl" color="secondary" className="max-w-3xl mx-auto">
                Demonstração das melhorias implementadas no design, UX e performance do sistema
              </Text>
              
              <div className="flex justify-center gap-4 mt-6">
                <Button
                  variant={currentDemo === 'enhanced' ? 'default' : 'outline'}
                  onClick={() => setCurrentDemo('enhanced')}
                  className="btn-apple"
                >
                  Dashboard Aprimorado
                </Button>
                <Button
                  variant={currentDemo === 'modern' ? 'default' : 'outline'}
                  onClick={() => setCurrentDemo('modern')}
                  className="btn-apple"
                >
                  Dashboard Moderno
                </Button>
              </div>
            </div>
          </FadeInUp>
        </div>
      </div>

      {/* Melhorias Implementadas */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <FadeInUp>
          <div className="text-center mb-12">
            <Heading level="h2" size="3xl" className="mb-4">
              Melhorias Implementadas
            </Heading>
            <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
              Principais aprimoramentos que elevam a experiência do usuário e a percepção de valor
            </Text>
          </div>
        </FadeInUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {improvements.map((improvement, index) => {
            const Icon = improvement.icon;
            return (
              <FadeInUp key={index} delay={index * 0.1}>
                <GlassCard variant="premium" className="h-full group hover:scale-105 transition-all duration-300">
                  <div className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${improvement.color}-500/20 to-${improvement.color}-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 text-${improvement.color}-600`} />
                    </div>
                    <Heading level="h3" size="lg" weight="semibold" className="mb-2">
                      {improvement.title}
                    </Heading>
                    <Text color="secondary" className="leading-relaxed">
                      {improvement.description}
                    </Text>
                  </div>
                </GlassCard>
              </FadeInUp>
            );
          })}
        </div>

        {/* Comparação Antes/Depois */}
        <FadeInUp>
          <GlassCard variant="premium" className="p-8 mb-12">
            <div className="text-center mb-8">
              <Heading level="h2" size="2xl" className="mb-4">
                Impacto das Melhorias
              </Heading>
              <Text color="secondary">
                Resultados esperados com as implementações do novo design system
              </Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">+25%</div>
                <Text weight="semibold" className="mb-1">Retenção de Usuários</Text>
                <Text size="sm" color="secondary">Interface mais intuitiva e agradável</Text>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">+15%</div>
                <Text weight="semibold" className="mb-1">Conversão</Text>
                <Text size="sm" color="secondary">Landing page mais atrativa</Text>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">+30%</div>
                <Text weight="semibold" className="mb-1">Satisfação</Text>
                <Text size="sm" color="secondary">UX mobile melhorada</Text>
              </div>
            </div>
          </GlassCard>
        </FadeInUp>

        {/* Tecnologias Utilizadas */}
        <FadeInUp>
          <GlassCard variant="gradient" className="p-8 mb-12">
            <div className="text-center mb-6">
              <Heading level="h3" size="xl" className="mb-2">
                Tecnologias e Padrões
              </Heading>
              <Text color="secondary">
                Stack moderno para máxima performance e escalabilidade
              </Text>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'Design Tokens',
                'Framer Motion',
                'Glassmorphism',
                'Mobile-First',
                'TypeScript',
                'Tailwind CSS',
                'Radix UI',
                'PWA Ready'
              ].map((tech, index) => (
                <div key={index} className="bg-background/50 backdrop-blur-sm rounded-lg p-3 text-center">
                  <Text size="sm" weight="medium">{tech}</Text>
                </div>
              ))}
            </div>
          </GlassCard>
        </FadeInUp>
      </div>

      {/* Dashboard Demo */}
      <div className="border-t border-border/30">
        {currentDemo === 'enhanced' ? (
          <EnhancedDashboard 
            onNavigateTo={(view, budgetId) => {
              console.log('Navigate to:', view, budgetId);
            }}
          />
        ) : (
          <ModernDashboard />
        )}
      </div>
    </div>
  );
};