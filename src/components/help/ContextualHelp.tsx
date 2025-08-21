import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Video, 
  MessageCircle, 
  ArrowRight,
  Lightbulb,
  Zap,
  Users,
  FileText,
  Settings,
  BarChart2,
  Shield,
  Star,
  HelpCircle
} from 'lucide-react';
import { HelpContent } from '@/hooks/useHelpSystem';

interface ContextualHelpProps {
  context: string;
  onContentSelect: (content: HelpContent) => void;
  onStartTutorial: () => void;
}

// Conteúdo de ajuda por contexto
const helpContentByContext: Record<string, HelpContent[]> = {
  dashboard: [
    {
      id: 'dashboard-overview',
      title: 'Visão Geral do Dashboard',
      description: 'Entenda como interpretar as métricas e gráficos do seu painel principal.',
      category: 'basic',
      tags: ['dashboard', 'métricas', 'gráficos'],
      icon: 'BarChart2',
      steps: [
        {
          title: 'Métricas Principais',
          description: 'Veja seu faturamento, ticket médio e total de orçamentos.',
          target: '[data-help="metrics"]',
          position: 'bottom'
        },
        {
          title: 'Gráfico de Vendas',
          description: 'Acompanhe a evolução das suas vendas ao longo do tempo.',
          target: '[data-help="sales-chart"]',
          position: 'top'
        }
      ]
    },
    {
      id: 'dashboard-quick-actions',
      title: 'Ações Rápidas',
      description: 'Aprenda a usar os botões de ação rápida para agilizar seu trabalho.',
      category: 'tips',
      tags: ['ações', 'produtividade'],
      icon: 'Zap'
    }
  ],
  budgets: [
    {
      id: 'budget-management',
      title: 'Gerenciar Orçamentos',
      description: 'Como visualizar, editar, compartilhar e organizar seus orçamentos.',
      category: 'basic',
      tags: ['orçamentos', 'gestão'],
      icon: 'FileText',
      steps: [
        {
          title: 'Lista de Orçamentos',
          description: 'Veja todos os seus orçamentos organizados por status.',
          target: '[data-help="budget-list"]',
          position: 'right'
        },
        {
          title: 'Filtros e Busca',
          description: 'Use filtros para encontrar orçamentos específicos rapidamente.',
          target: '[data-help="budget-filters"]',
          position: 'bottom'
        }
      ]
    },
    {
      id: 'budget-status',
      title: 'Status dos Orçamentos',
      description: 'Entenda o significado de cada status e como gerenciar o fluxo.',
      category: 'faq',
      tags: ['status', 'fluxo'],
      icon: 'BookOpen'
    }
  ],
  'new-budget': [
    {
      id: 'create-budget',
      title: 'Criar Novo Orçamento',
      description: 'Passo a passo completo para criar orçamentos profissionais.',
      category: 'tutorial',
      tags: ['criar', 'orçamento', 'tutorial'],
      icon: 'FileText',
      steps: [
        {
          title: 'Dados do Cliente',
          description: 'Preencha as informações básicas do cliente.',
          target: '[data-help="client-info"]',
          position: 'right'
        },
        {
          title: 'Informações do Dispositivo',
          description: 'Adicione detalhes sobre o dispositivo e problema.',
          target: '[data-help="device-info"]',
          position: 'right'
        },
        {
          title: 'Serviços e Valores',
          description: 'Defina os serviços e valores do orçamento.',
          target: '[data-help="services"]',
          position: 'right'
        }
      ]
    }
  ],
  clients: [
    {
      id: 'client-management',
      title: 'Gestão de Clientes',
      description: 'Como cadastrar, editar e organizar sua base de clientes.',
      category: 'basic',
      tags: ['clientes', 'cadastro'],
      icon: 'Users'
    }
  ],
  settings: [
    {
      id: 'company-settings',
      title: 'Configurações da Empresa',
      description: 'Personalize as informações que aparecem nos seus orçamentos.',
      category: 'basic',
      tags: ['empresa', 'personalização'],
      icon: 'Settings'
    }
  ],
  general: [
    {
      id: 'getting-started',
      title: 'Primeiros Passos',
      description: 'Guia completo para começar a usar o sistema.',
      category: 'tutorial',
      tags: ['início', 'básico'],
      icon: 'BookOpen'
    }
  ],
  plans: [
    {
      id: 'plans-overview',
      title: 'Escolhendo um Plano',
      description: 'Veja como comparar planos, entender benefícios e assinar o ideal para seu negócio.',
      category: 'basic',
      tags: ['planos', 'assinatura', 'benefícios'],
      icon: 'BookOpen',
      steps: [
        {
          title: 'Comparação de Planos',
          description: 'Compare recursos, preços e escolha o que melhor atende sua assistência.',
          target: '[data-help="plan-comparison"]',
          position: 'bottom'
        },
        {
          title: 'Assinatura e Pagamento',
          description: 'Veja como assinar e enviar comprovante pelo WhatsApp.',
          target: '[data-help="plan-payment"]',
          position: 'right'
        }
      ]
    }
  ],
  index: [
    {
      id: 'welcome',
      title: 'Bem-vindo ao OneDrip!',
      description: 'Descubra as principais funcionalidades e como começar rapidamente.',
      category: 'tutorial',
      tags: ['início', 'apresentação'],
      icon: 'Lightbulb',
      steps: [
        {
          title: 'Cadastro e Login',
          description: 'Crie sua conta ou faça login para acessar o sistema.',
          target: '[data-help="login-section"]',
          position: 'bottom'
        },
        {
          title: 'Explorando o Sistema',
          description: 'Veja as principais áreas: orçamentos, clientes, relatórios e configurações.',
          target: '[data-help="features-section"]',
          position: 'bottom'
        }
      ]
    }
  ],
  license: [
    {
      id: 'license-help',
      title: 'Licença Expirada ou Conta Inativa',
      description: 'Saiba como renovar sua licença ou ativar sua conta para continuar usando o sistema.',
      category: 'faq',
      tags: ['licença', 'renovação', 'ativação'],
      icon: 'Shield',
      steps: [
        {
          title: 'Entrar em Contato',
          description: 'Fale com o suporte via WhatsApp para ativar ou renovar sua licença.',
          target: '[data-help="license-support"]',
          position: 'bottom'
        }
      ]
    }
  ],
  purchase: [
    {
      id: 'purchase-success',
      title: 'Sucesso na Compra',
      description: 'Veja os próximos passos após a confirmação do pagamento.',
      category: 'tips',
      tags: ['compra', 'pagamento', 'acesso'],
      icon: 'Star',
      steps: [
        {
          title: 'Envio do Comprovante',
          description: 'Envie o comprovante de pagamento pelo WhatsApp para liberar seu acesso.',
          target: '[data-help="purchase-whatsapp"]',
          position: 'bottom'
        },
        {
          title: 'Recebendo Credenciais',
          description: 'Aguarde a confirmação e receba suas credenciais para acessar o sistema.',
          target: '[data-help="purchase-credentials"]',
          position: 'bottom'
        }
      ]
    }
  ],
  notfound: [
    {
      id: 'notfound-help',
      title: 'Página Não Encontrada (404)',
      description: 'Saiba o que fazer se você cair em uma página inexistente.',
      category: 'faq',
      tags: ['erro', '404', 'ajuda'],
      icon: 'HelpCircle',
      steps: [
        {
          title: 'Voltar ao Início',
          description: 'Clique para retornar à página inicial e continue sua navegação.',
          target: '[data-help="notfound-home"]',
          position: 'bottom'
        }
      ]
    }
  ]
};

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    BarChart2,
    Zap,
    FileText,
    BookOpen,
    Users,
    Settings,
    Lightbulb,
    Shield,
    Star,
    HelpCircle
  };
  
  const IconComponent = icons[iconName] || BookOpen;
  return <IconComponent className="h-4 w-4" />;
};

export const ContextualHelp = ({
  context,
  onContentSelect,
  onStartTutorial
}: ContextualHelpProps) => {
  const contextHelp = helpContentByContext[context] || helpContentByContext.general;
  
  const tutorialContent = contextHelp.find(content => content.category === 'tutorial');

  return (
    <div className="space-y-4">
      {/* Tutorial em Destaque */}
      {tutorialContent && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  {getIcon(tutorialContent.icon || 'BookOpen')}
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">
                    {tutorialContent.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">
                    Tutorial Interativo
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              {tutorialContent.description}
            </p>
            <Button
              onClick={() => onStartTutorial()}
              size="sm"
              className="w-full gap-2"
            >
              <Video className="h-3 w-3" />
              Iniciar Tutorial
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Outros Conteúdos de Ajuda */}
      <div className="space-y-3">
        {contextHelp.filter(content => content.category !== 'tutorial').map((content) => (
          <Card 
            key={content.id} 
            className="hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onContentSelect(content)}
            tabIndex={0}
            aria-label={`Abrir ajuda: ${content.title}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    {getIcon(content.icon || 'BookOpen')}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{content.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {content.description}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {content.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sugestões Rápidas */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-medium">Dicas Rápidas</h4>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary"></div>
              <span>Use Ctrl+H para abrir a ajuda rapidamente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary"></div>
              <span>Clique no ícone ? ao lado dos campos para ajuda contextual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary"></div>
              <span>Use a busca para encontrar respostas específicas</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};