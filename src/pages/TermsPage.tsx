import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Users, Shield, AlertTriangle, CreditCard, Gavel, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsPage = () => {
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
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Termos de Uso
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              OneDrip - Última atualização: Janeiro de 2025
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Introdução */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                1. Aceitação dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar o sistema OneDrip, desenvolvido por André Ribeiro Lima (KukySolutions™), 
                você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com 
                qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
            </section>

            {/* Definições */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                2. Definições
              </h2>
              <div className="space-y-3">
                <div>
                  <strong className="text-foreground">Sistema/Plataforma:</strong>
                  <span className="text-muted-foreground ml-2">
                    O software OneDrip e todos os seus componentes, funcionalidades e serviços relacionados.
                  </span>
                </div>
                <div>
                  <strong className="text-foreground">Usuário:</strong>
                  <span className="text-muted-foreground ml-2">
                    Pessoa física ou jurídica que utiliza o sistema mediante licença válida.
                  </span>
                </div>
                <div>
                  <strong className="text-foreground">Prestador:</strong>
                  <span className="text-muted-foreground ml-2">
                    André Ribeiro Lima (KukySolutions™), desenvolvedor e proprietário do sistema.
                  </span>
                </div>
                <div>
                  <strong className="text-foreground">Conteúdo:</strong>
                  <span className="text-muted-foreground ml-2">
                    Todas as informações, dados, textos, imagens e materiais inseridos no sistema.
                  </span>
                </div>
              </div>
            </section>

            {/* Licença de Uso */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                3. Licença de Uso
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">3.1 Concessão de Licença</h3>
                  <p className="text-muted-foreground">
                    Concedemos a você uma licença limitada, não exclusiva, não transferível e revogável para 
                    usar o sistema OneDrip conforme os termos desta licença e do contrato de prestação de serviços.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">3.2 Restrições de Uso</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Não copiar, modificar ou distribuir o sistema</li>
                    <li>Não fazer engenharia reversa ou tentar acessar o código-fonte</li>
                    <li>Não sublicenciar ou transferir seus direitos de uso</li>
                    <li>Não usar o sistema para fins ilegais ou não autorizados</li>
                    <li>Não sobrecarregar ou interferir na operação do sistema</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Responsabilidades do Usuário */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                4. Responsabilidades do Usuário
              </h2>
              <p className="text-muted-foreground mb-4">Como usuário do sistema, você se compromete a:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Usar o sistema apenas para fins legítimos e autorizados</li>
                <li>Respeitar os direitos de propriedade intelectual</li>
                <li>Não violar leis ou regulamentos aplicáveis</li>
                <li>Reportar problemas de segurança ou uso indevido</li>
                <li>Manter seus dados e informações atualizados</li>
              </ul>
            </section>

            {/* Propriedade Intelectual */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                5. Propriedade Intelectual
              </h2>
              <p className="text-muted-foreground mb-4">
                Todos os direitos de propriedade intelectual sobre o sistema OneDrip, incluindo mas não limitado a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Código-fonte, algoritmos e arquitetura do sistema</li>
                <li>Design, interface e experiência do usuário</li>
                <li>Marca, logotipos e identidade visual</li>
                <li>Documentação técnica e materiais de treinamento</li>
                <li>Metodologias e processos desenvolvidos</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                São de propriedade exclusiva de André Ribeiro Lima (KukySolutions™) e estão protegidos pelas 
                leis de direitos autorais e propriedade intelectual.
              </p>
            </section>

            {/* Disponibilidade do Serviço */}
            <section>
              <h2 className="text-xl font-semibold mb-4">6. Disponibilidade do Serviço</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">6.1 Uptime e Manutenção</h3>
                  <p className="text-muted-foreground">
                    Nos esforçamos para manter o sistema disponível 24/7, mas não garantimos disponibilidade 
                    ininterrupta. Manutenções programadas serão comunicadas com antecedência.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">6.2 Interrupções</h3>
                  <p className="text-muted-foreground">
                    Não nos responsabilizamos por interrupções causadas por fatores externos, como falhas 
                    de internet, problemas de infraestrutura ou casos de força maior.
                  </p>
                </div>
              </div>
            </section>

            {/* Pagamentos e Cobrança */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                7. Pagamentos e Cobrança
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">7.1 Taxas e Pagamentos</h3>
                  <p className="text-muted-foreground">
                    Os valores e condições de pagamento estão especificados no plano contratado. 
                    Pagamentos devem ser realizados nas datas acordadas.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">7.2 Atraso no Pagamento</h3>
                  <p className="text-muted-foreground">
                    O atraso no pagamento pode resultar na suspensão temporária ou cancelamento do acesso 
                    ao sistema, conforme especificado no contrato.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">7.3 Reembolsos</h3>
                  <p className="text-muted-foreground">
                    Políticas de reembolso serão aplicadas conforme acordado no contrato de prestação de serviços 
                    e legislação aplicável.
                  </p>
                </div>
              </div>
            </section>

            {/* Limitação de Responsabilidade */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                8. Limitação de Responsabilidade
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">8.1 Isenção de Garantias</h3>
                  <p className="text-muted-foreground">
                    O sistema é fornecido "como está", sem garantias expressas ou implícitas de funcionamento 
                    perfeito, adequação a propósitos específicos ou ausência de erros.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">8.2 Limitação de Danos</h3>
                  <p className="text-muted-foreground">
                    Nossa responsabilidade por danos diretos ou indiretos está limitada ao valor pago pelo 
                    usuário nos últimos 12 meses, exceto em casos de dolo ou culpa grave.
                  </p>
                </div>
              </div>
            </section>

            {/* Rescisão */}
            <section>
              <h2 className="text-xl font-semibold mb-4">9. Rescisão</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">9.1 Rescisão pelo Usuário</h3>
                  <p className="text-muted-foreground">
                    Você pode cancelar sua conta a qualquer momento, observando o prazo de aviso prévio 
                    especificado no contrato.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">9.2 Rescisão pelo Prestador</h3>
                  <p className="text-muted-foreground">
                    Podemos suspender ou cancelar sua conta em caso de violação destes termos, 
                    inadimplência ou uso inadequado do sistema.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">9.3 Efeitos da Rescisão</h3>
                  <p className="text-muted-foreground">
                    Após a rescisão, seu acesso será suspenso e seus dados poderão ser removidos conforme 
                    nossa política de retenção de dados.
                  </p>
                </div>
              </div>
            </section>

            {/* Legislação Aplicável */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                10. Legislação Aplicável e Foro
              </h2>
              <p className="text-muted-foreground">
                Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa será resolvida 
                no foro da Comarca de Goiânia/GO, com renúncia expressa a qualquer outro foro, por mais 
                privilegiado que seja.
              </p>
            </section>

            {/* Alterações */}
            <section>
              <h2 className="text-xl font-semibold mb-4">11. Alterações nos Termos</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações 
                significativas serão comunicadas com antecedência de 30 dias. O uso continuado do sistema 
                após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            {/* Contato */}
            <section className="bg-muted/50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">12. Contato</h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>Responsável:</strong> André Ribeiro Lima (KukySolutions™)
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
                  Para dúvidas sobre estes termos ou questões legais, entre em contato conosco através 
                  dos canais acima.
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