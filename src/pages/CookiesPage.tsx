import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Cookie, Shield, BarChart3, Settings, Info, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const CookiesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Sempre habilitado
    analytics: true,
    functional: true,
    marketing: false
  });

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePreferenceChange = (type: string, value: boolean) => {
    if (type === 'essential') return; // Não pode ser desabilitado
    
    setCookiePreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSavePreferences = () => {
    // Salvar preferências no localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    
    toast({
      title: "Preferências salvas",
      description: "Suas preferências de cookies foram atualizadas com sucesso.",
    });
  };

  const cookieTypes = [
    {
      id: 'essential',
      name: 'Cookies Essenciais',
      description: 'Necessários para o funcionamento básico do sistema. Não podem ser desabilitados.',
      icon: Shield,
      required: true,
      examples: ['Autenticação', 'Segurança', 'Preferências de idioma']
    },
    {
      id: 'functional',
      name: 'Cookies Funcionais',
      description: 'Melhoram a funcionalidade e personalização do sistema.',
      icon: Settings,
      required: false,
      examples: ['Preferências de tema', 'Configurações de layout', 'Dados de formulário']
    },
    {
      id: 'analytics',
      name: 'Cookies de Análise',
      description: 'Ajudam a entender como você usa o sistema para melhorarmos a experiência.',
      icon: BarChart3,
      required: false,
      examples: ['Google Analytics', 'Métricas de uso', 'Relatórios de performance']
    },
    {
      id: 'marketing',
      name: 'Cookies de Marketing',
      description: 'Usados para personalizar anúncios e medir a eficácia de campanhas.',
      icon: Cookie,
      required: false,
      examples: ['Publicidade direcionada', 'Remarketing', 'Análise de conversão']
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Main Content */}
        <Card className="backdrop-blur-sm bg-card/95 border-primary/20">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Cookie className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Política de Cookies
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              OneDrip - Última atualização: Janeiro de 2025
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Introdução */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                O que são Cookies?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies são pequenos arquivos de texto armazenados em seu dispositivo quando você visita nosso sistema. 
                Eles nos ajudam a fornecer uma experiência melhor, mais segura e personalizada. Esta política explica 
                como usamos cookies e como você pode controlá-los.
              </p>
            </section>

            {/* Configurações de Cookies */}
            <section>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurações de Cookies
              </h2>
              
              <div className="space-y-6">
                {cookieTypes.map((type) => {
                  const IconComponent = type.icon;
                  const isEnabled = cookiePreferences[type.id as keyof typeof cookiePreferences];
                  
                  return (
                    <Card key={type.id} className="border-muted">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{type.name}</h3>
                                {type.required && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                                    Obrigatório
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-muted-foreground mb-4">
                              {type.description}
                            </p>
                            
                            <div>
                              <h4 className="font-medium mb-2">Exemplos de uso:</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {type.examples.map((example, index) => (
                                  <li key={index}>{example}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-2">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => handlePreferenceChange(type.id, checked)}
                              disabled={type.required}
                            />
                            <span className="text-xs text-muted-foreground">
                              {isEnabled ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="flex justify-center mt-6">
                <Button onClick={handleSavePreferences} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Preferências
                </Button>
              </div>
            </section>

            {/* Como usamos os Cookies */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Como Usamos os Cookies</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">🔐 Autenticação e Segurança</h3>
                  <p className="text-muted-foreground">
                    Mantemos você logado com segurança e protegemos contra ataques maliciosos.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">⚙️ Preferências do Usuário</h3>
                  <p className="text-muted-foreground">
                    Lembramos suas configurações de tema, idioma e layout para uma experiência personalizada.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">📊 Análise e Melhoria</h3>
                  <p className="text-muted-foreground">
                    Coletamos dados anônimos sobre o uso do sistema para identificar melhorias.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">🎯 Funcionalidades Avançadas</h3>
                  <p className="text-muted-foreground">
                    Habilitamos recursos como salvamento automático e sincronização entre dispositivos.
                  </p>
                </div>
              </div>
            </section>

            {/* Tipos de Cookies Detalhados */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Tipos de Cookies Detalhados</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Por Duração:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li><strong>Cookies de Sessão:</strong> Expiram quando você fecha o navegador</li>
                    <li><strong>Cookies Persistentes:</strong> Permanecem por um período determinado</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Por Origem:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li><strong>Cookies Próprios:</strong> Definidos diretamente pelo OneDrip</li>
                    <li><strong>Cookies de Terceiros:</strong> Definidos por serviços integrados (ex: Google Analytics)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Controle de Cookies */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Como Controlar os Cookies</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">🌐 Configurações do Navegador</h3>
                  <p className="text-muted-foreground mb-2">
                    Você pode controlar cookies através das configurações do seu navegador:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li><strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies</li>
                    <li><strong>Firefox:</strong> Configurações → Privacidade e segurança → Cookies</li>
                    <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
                    <li><strong>Edge:</strong> Configurações → Cookies e permissões de site</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">⚙️ Configurações do Sistema</h3>
                  <p className="text-muted-foreground">
                    Use as configurações acima nesta página para controlar especificamente os cookies do OneDrip.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies de Terceiros */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Cookies de Terceiros</h2>
              <p className="text-muted-foreground mb-4">
                Utilizamos alguns serviços de terceiros que podem definir seus próprios cookies:
              </p>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Google Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Usado para análise de tráfego e comportamento dos usuários. 
                    <Button variant="link" className="p-0 h-auto text-primary ml-1" asChild>
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                        Política de Privacidade do Google
                      </a>
                    </Button>
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Supabase</h3>
                  <p className="text-sm text-muted-foreground">
                    Nossa infraestrutura de backend pode usar cookies para autenticação e segurança.
                    <Button variant="link" className="p-0 h-auto text-primary ml-1" asChild>
                      <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                        Política de Privacidade do Supabase
                      </a>
                    </Button>
                  </p>
                </div>
              </div>
            </section>

            {/* Impacto da Desabilitação */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Impacto da Desabilitação de Cookies</h2>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Importante: Funcionalidades Afetadas
                    </h3>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• Desabilitar cookies essenciais impedirá o funcionamento do sistema</li>
                      <li>• Cookies funcionais desabilitados podem afetar a experiência personalizada</li>
                      <li>• Sem cookies de análise, não poderemos melhorar o sistema baseado no uso</li>
                      <li>• Você precisará fazer login novamente a cada sessão</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Atualizações */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Atualizações desta Política</h2>
              <p className="text-muted-foreground">
                Esta Política de Cookies pode ser atualizada periodicamente para refletir mudanças em nossos 
                serviços ou regulamentações. Notificaremos sobre alterações significativas através do sistema 
                ou por e-mail. A versão mais atual estará sempre disponível nesta página.
              </p>
            </section>

            {/* Contato */}
            <section className="bg-muted/50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Dúvidas sobre Cookies?</h2>
              <p className="text-muted-foreground mb-4">
                Se você tiver dúvidas sobre nossa política de cookies ou como gerenciar suas preferências, 
                entre em contato conosco:
              </p>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>E-mail:</strong> suporte@onedrip.email
                </p>
                <p className="text-muted-foreground">
                  <strong>WhatsApp:</strong> +55 (64) 9602-8022
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                © 2025 OneDrip - KukySolutions™ | Todos os direitos reservados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};