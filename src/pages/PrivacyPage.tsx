import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, FileText, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

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
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Política de Privacidade
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              OneDrip - Última atualização: Janeiro de 2025
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Introdução */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                1. Introdução
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A OneDrip, desenvolvida por André Ribeiro Lima (KukySolutions™), está comprometida em proteger 
                a privacidade e os dados pessoais de nossos usuários. Esta Política de Privacidade descreve como 
                coletamos, usamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral 
                de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais regulamentações aplicáveis.
              </p>
            </section>

            {/* Dados Coletados */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                2. Dados Coletados
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">2.1 Dados Pessoais Fornecidos</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Nome completo e informações de identificação</li>
                    <li>Endereço de e-mail e telefone</li>
                    <li>Informações da empresa (CNPJ, razão social)</li>
                    <li>Dados de acesso (login e senha criptografada)</li>
                    <li>Informações de perfil e preferências</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">2.2 Dados Técnicos Automaticamente Coletados</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Endereço IP e informações de localização</li>
                    <li>Tipo de dispositivo e sistema operacional</li>
                    <li>Navegador utilizado e versão</li>
                    <li>Logs de acesso e atividade no sistema</li>
                    <li>Cookies e tecnologias similares</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Finalidade do Tratamento */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                3. Finalidade do Tratamento
              </h2>
              <p className="text-muted-foreground mb-4">Utilizamos seus dados pessoais para:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Fornecer e manter os serviços do sistema OneDrip</li>
                <li>Autenticar e autorizar o acesso ao sistema</li>
                <li>Processar e gerenciar orçamentos e clientes</li>
                <li>Enviar comunicações importantes sobre o serviço</li>
                <li>Melhorar a experiência do usuário e funcionalidades</li>
                <li>Cumprir obrigações legais e regulamentares</li>
                <li>Prevenir fraudes e garantir a segurança do sistema</li>
              </ul>
            </section>

            {/* Base Legal */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                4. Base Legal para o Tratamento
              </h2>
              <p className="text-muted-foreground mb-4">O tratamento de dados pessoais é baseado em:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Execução de contrato:</strong> Para prestação dos serviços contratados</li>
                <li><strong>Consentimento:</strong> Para funcionalidades opcionais e comunicações</li>
                <li><strong>Legítimo interesse:</strong> Para segurança e melhoria dos serviços</li>
                <li><strong>Cumprimento de obrigação legal:</strong> Para atender exigências regulamentares</li>
              </ul>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                5. Compartilhamento de Dados
              </h2>
              <p className="text-muted-foreground mb-4">
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto nas seguintes situações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Com prestadores de serviços essenciais (Supabase para infraestrutura)</li>
                <li>Quando exigido por lei ou ordem judicial</li>
                <li>Para proteger nossos direitos legais ou segurança</li>
                <li>Com seu consentimento expresso</li>
              </ul>
            </section>

            {/* Segurança */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                6. Segurança dos Dados
              </h2>
              <p className="text-muted-foreground mb-4">Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Autenticação multifator e controle de acesso</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e plano de recuperação</li>
                <li>Auditoria e logs de segurança</li>
              </ul>
            </section>

            {/* Retenção */}
            <section>
              <h2 className="text-xl font-semibold mb-4">7. Retenção de Dados</h2>
              <p className="text-muted-foreground">
                Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, 
                respeitando os prazos legais de retenção. Após esse período, os dados são anonimizados ou excluídos de 
                forma segura.
              </p>
            </section>

            {/* Direitos do Titular */}
            <section>
              <h2 className="text-xl font-semibold mb-4">8. Seus Direitos</h2>
              <p className="text-muted-foreground mb-4">Conforme a LGPD, você tem direito a:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Confirmação da existência de tratamento de dados</li>
                <li>Acesso aos seus dados pessoais</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade dos dados</li>
                <li>Eliminação dos dados tratados com consentimento</li>
                <li>Revogação do consentimento</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold mb-4">9. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies essenciais para o funcionamento do sistema e cookies de análise para melhorar 
                nossos serviços. Você pode gerenciar suas preferências de cookies através das configurações do 
                seu navegador. Para mais informações, consulte nossa 
                <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate('/cookies')}>
                  Política de Cookies
                </Button>.
              </p>
            </section>

            {/* Alterações */}
            <section>
              <h2 className="text-xl font-semibold mb-4">10. Alterações nesta Política</h2>
              <p className="text-muted-foreground">
                Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos sobre mudanças 
                significativas através do sistema ou por e-mail. A versão mais atual estará sempre disponível 
                em nosso site.
              </p>
            </section>

            {/* Contato */}
            <section className="bg-muted/50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">11. Contato - Encarregado de Dados</h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>Encarregado de Proteção de Dados:</strong> André Ribeiro Lima
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>suporte@onedrip.email</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>+55 (64) 99602-8022</span>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato conosco 
                  através dos canais acima.
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