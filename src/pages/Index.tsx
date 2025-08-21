
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calculator, Smartphone, Shield, Star, Activity, ArrowRight, CheckCircle } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/loading-states';
import { FadeInUp, ScaleOnHover, StaggerList } from '@/components/ui/animations';
import { Heading, Text } from '@/components/ui/typography';
import { useAppInfo, useMarketingConfig } from '@/hooks/useAppConfig';


const Index = () => {
  const {
    user,
    loading
  } = useAuth();
  
  const { name, logo } = useAppInfo();
  const { heroSubtitle } = useMarketingConfig();
  
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Se o usuário estiver logado, redireciona para o painel (versão iOS principal)
  if (user) {
    return <Navigate to="/painel" replace />;
  }

  // Landing page para usuários não logados
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="glass border-b shadow-soft sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2 interactive-scale">
              <img alt={`${name} Logo`} className="h-8 w-8" src={logo} />
              <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            </Link>
            <div className="flex items-center space-x-2">
              <Button asChild variant="outline" className="btn-apple-secondary interactive-scale">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild className="btn-apple interactive-scale">
                <Link to="/sign">Criar Conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 to-background"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <FadeInUp>
            <Heading level="h1" size="5xl" gradient className="mb-6 leading-tight">
              Gerencie seus Orçamentos
              <br />
              de forma profissional
            </Heading>
            <Text size="xl" color="secondary" className="mb-8 max-w-2xl mx-auto">
              Sistema completo para assistências técnicas gerenciarem orçamentos, 
              clientes e relatórios de forma eficiente e organizada.
            </Text>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ScaleOnHover>
                <Button asChild className="btn-premium text-lg px-8 py-4 group">
                  <Link to="/plans">
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </ScaleOnHover>
              <ScaleOnHover>
                <Button className="btn-mercadopago text-lg px-8 py-4" onClick={() => openWhatsApp('https://wa.me/556496028022')}>
                  Confirmar Pagamento
                </Button>
              </ScaleOnHover>
              <ScaleOnHover>
                <Button variant="outline" className="btn-apple-secondary text-lg px-8 py-4" onClick={() => openWhatsApp('https://wa.me/556496028022')}>
                  Entre em contato
                </Button>
              </ScaleOnHover>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <FadeInUp className="text-center mb-16">
            <Heading level="h2" size="4xl" className="mb-4">
              Funcionalidades Principais
            </Heading>
            <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
              Descubra como nosso sistema pode transformar a gestão da sua assistência técnica
            </Text>
          </FadeInUp>
          
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{
              icon: FileText,
              title: "Orçamentos Detalhados",
              description: "Crie orçamentos profissionais com peças, serviços e condições de pagamento personalizadas.",
              color: "blue"
            }, {
              icon: Smartphone,
              title: "Gestão de Dispositivos",
              description: "Cadastre diferentes tipos de dispositivos, marcas e defeitos para agilizar o atendimento.",
              color: "green"
            }, {
              icon: Star,
              title: "Preço Acessível",
              description: "Planos que cabem no seu bolso, focados na sua necessidade e sem surpresas.",
              color: "yellow"
            }, {
              icon: Activity,
              title: "Agilidade e Utilidade",
              description: "Ferramenta rápida e intuitiva, projetada para otimizar o dia a dia da sua assistência.",
              color: "purple"
            }, {
              icon: Shield,
              title: "Segurança Avançada",
              description: "Controle de acesso por usuário com diferentes níveis de permissão e auditoria completa.",
              color: "red"
            }, {
              icon: Calculator,
              title: "Cálculos Automáticos",
              description: "Cálculo automático de totais, impostos e condições de pagamento personalizadas.",
              color: "indigo"
            }].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <ScaleOnHover key={index}>
                  <Card className="glass-card group h-full border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="pb-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                        <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text color="secondary" className="leading-relaxed">
                        {feature.description}
                      </Text>
                      <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <Text size="sm" weight="medium">Incluído no plano</Text>
                      </div>
                    </CardContent>
                  </Card>
                </ScaleOnHover>
              );
            })}
          </StaggerList>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background to-primary/5"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <FadeInUp>
            <Heading level="h2" size="4xl" className="mb-6">
              Pronto para otimizar sua assistência técnica?
            </Heading>
            <Text size="xl" color="secondary" className="mb-8 max-w-2xl mx-auto">
              {heroSubtitle}
            </Text>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ScaleOnHover>
                <Button asChild className="btn-premium text-lg px-8 py-4 group">
                  <Link to="/plans">
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </ScaleOnHover>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Text size="sm">Sem compromisso • Cancele quando quiser</Text>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-muted/20 to-background border-t border-border/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeInUp className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <img alt={`${name} Logo`} className="h-8 w-8" src={logo} />
              <Heading level="h3" size="2xl">{name}</Heading>
            </div>
            <Text color="secondary" className="mb-4">
              © 2025 Sistema profissional para gestão de orçamentos.
            </Text>
            <Text size="sm" color="muted" className="mb-4">
              Transformando a gestão de assistências técnicas através da tecnologia
            </Text>
            <div className="flex justify-center gap-4 mt-4">
              <Link 
                to="/terms" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Termos de Uso
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link 
                to="/privacy" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Política de Privacidade
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link 
                to="/cookies" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Política de Cookies
              </Link>
            </div>
          </FadeInUp>
        </div>
      </footer>
    </div>
  );
};

export default Index;
