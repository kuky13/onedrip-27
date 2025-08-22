import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileText, Cookie, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { setSecureItem, getSecureItem, removeSecureItem } from '@/utils/secureStorage';
interface AcceptTermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}
export const AcceptTermsModal: React.FC<AcceptTermsModalProps> = ({
  isOpen,
  onAccept,
  onDecline
}) => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [acceptedTerms, setAcceptedTerms] = useState({
    privacy: false,
    terms: false,
    cookies: false
  });
  const [showDetails, setShowDetails] = useState(false);
  const allTermsAccepted = acceptedTerms.privacy && acceptedTerms.terms && acceptedTerms.cookies;
  const handleSelectAll = () => {
    const newState = !allTermsAccepted;
    setAcceptedTerms({
      privacy: newState,
      terms: newState,
      cookies: newState
    });
  };
  const handleAcceptanceChange = (type: keyof typeof acceptedTerms, checked: boolean) => {
    setAcceptedTerms(prev => ({
      ...prev,
      [type]: checked
    }));
  };
  const handleAcceptAll = async () => {
    if (!allTermsAccepted) {
      toast({
        title: "Aceite necessário",
        description: "Você deve aceitar todos os termos para continuar usando o sistema.",
        variant: "destructive"
      });
      return;
    }

    // Salvar aceitação no localStorage com timestamp
    const acceptanceData = {
      ...acceptedTerms,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    await setSecureItem('termsAcceptance', acceptanceData, { encrypt: true });
    toast({
      title: "Termos aceitos",
      description: "Obrigado por aceitar nossos termos e políticas."
    });
    onAccept();
  };
  const handleDecline = () => {
    toast({
      title: "Termos não aceitos",
      description: "Você será redirecionado para a página inicial.",
      variant: "destructive"
    });
    onDecline();
  };
  const openExternalPage = (path: string) => {
    window.open(path, '_blank', 'noopener,noreferrer');
  };
  const termsData = [{
    id: 'privacy',
    title: 'Política de Privacidade',
    description: 'Como coletamos, usamos e protegemos seus dados pessoais em conformidade com a LGPD.',
    icon: Shield,
    path: '/privacy',
    key: 'privacy' as keyof typeof acceptedTerms,
    highlights: ['Proteção de dados pessoais', 'Conformidade com LGPD', 'Direitos do titular dos dados', 'Segurança da informação']
  }, {
    id: 'terms',
    title: 'Termos de Uso',
    description: 'Regras e condições para uso do sistema OneDrip.',
    icon: FileText,
    path: '/terms',
    key: 'terms' as keyof typeof acceptedTerms,
    highlights: ['Licença de uso do sistema', 'Responsabilidades do usuário', 'Propriedade intelectual', 'Limitações de responsabilidade']
  }, {
    id: 'cookies',
    title: 'Política de Cookies',
    description: 'Como usamos cookies para melhorar sua experiência no sistema.',
    icon: Cookie,
    path: '/cookies',
    key: 'cookies' as keyof typeof acceptedTerms,
    highlights: ['Tipos de cookies utilizados', 'Controle de preferências', 'Cookies de terceiros', 'Configurações do navegador']
  }];
  return <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md sm:max-w-4xl max-h-[90vh] sm:max-h-[90vh] p-0 gap-0 overflow-hidden mx-2 sm:mx-auto rounded-3xl sm:rounded-xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl">
        {/* Header - Estilo iOS */}
        <div className="relative p-4 sm:p-6 pb-4 sm:pb-4 bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/80 backdrop-blur-sm rounded-t-3xl sm:rounded-t-xl">
          {/* Indicador de modal iOS */}
          <div className="flex justify-center mb-3 sm:hidden">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
          
          <DialogHeader className="space-y-2 sm:space-y-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white tracking-tight">
              🔒 Termos e Políticas
            </DialogTitle>
            <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-300 text-center font-medium">
              Para continuar usando o sistema, aceite nossos termos
            </p>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh] sm:max-h-[65vh] px-4 sm:px-6">
          <CardContent className="space-y-5 sm:space-y-6 p-0 pt-4">
            {/* Aceitar todos - Estilo iOS Card */}
            <div className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-700/50 rounded-2xl p-5 sm:p-6 backdrop-blur-sm shadow-lg shadow-green-100/50 dark:shadow-green-900/20">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-green-800 dark:text-green-200 mb-2 tracking-tight">
                    🚀 Aceitar Todos os Termos
                  </h3>
                  <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-medium leading-relaxed">
                    Aceite rapidamente todos os termos e políticas para começar a usar o sistema
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm">
                  <Checkbox id="select-all" checked={allTermsAccepted} onCheckedChange={handleSelectAll} className="h-6 w-6 border-2 rounded-lg data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                  <label htmlFor="select-all" className="text-base sm:text-lg font-semibold cursor-pointer text-green-800 dark:text-green-200 select-none">
                    Aceito todos os termos
                  </label>
                </div>
                
                {allTermsAccepted && <div className="text-green-600 dark:text-green-400 text-sm font-semibold bg-green-100/80 dark:bg-green-900/40 px-4 py-2 rounded-xl backdrop-blur-sm">
                    ✅ Perfeito! Você pode continuar agora
                  </div>}
              </div>
            </div>

            {/* Divisor - Estilo iOS */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200/60 dark:border-gray-700/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white/80 dark:bg-gray-900/80 px-4 py-1 text-gray-500 dark:text-gray-400 font-semibold rounded-full backdrop-blur-sm">ou aceite individualmente</span>
              </div>
            </div>

            {/* Lista de termos - Estilo iOS Cards */}
            <div className="space-y-3">
              {termsData.map(term => {
              const IconComponent = term.icon;
              const isAccepted = acceptedTerms[term.key];
              return <div key={term.id} className={`border rounded-2xl p-4 sm:p-4 transition-all duration-300 backdrop-blur-sm shadow-sm ${isAccepted ? 'border-green-300/60 bg-green-50/80 dark:border-green-600/60 dark:bg-green-900/30 shadow-green-100/50 dark:shadow-green-900/20' : 'border-gray-200/60 bg-white/80 dark:border-gray-700/60 dark:bg-gray-800/60 hover:bg-gray-50/90 dark:hover:bg-gray-800/80'}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className={`p-3 rounded-xl transition-all duration-200 ${isAccepted ? 'bg-green-100/80 dark:bg-green-800/40 shadow-sm' : 'bg-gray-100/80 dark:bg-gray-700/60'}`}>
                          <IconComponent className={`h-5 w-5 ${isAccepted ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white tracking-tight">{term.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-1 font-medium">
                              {term.description}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => openExternalPage(term.path)} className="flex items-center gap-1 text-xs px-3 py-2 h-auto hover:bg-blue-50/80 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-semibold transition-all duration-200">
                            <ExternalLink className="h-3 w-3" />
                            <span className="hidden sm:inline">Ler</span>
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-3 p-2 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm">
                          <Checkbox id={term.id} checked={isAccepted} onCheckedChange={checked => handleAcceptanceChange(term.key, checked as boolean)} className="h-5 w-5 rounded-lg data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                          <label htmlFor={term.id} className="text-sm sm:text-sm font-semibold cursor-pointer text-gray-800 dark:text-gray-200 select-none flex-1">
                            Li e aceito
                          </label>
                          {isAccepted && <span className="text-green-600 dark:text-green-400 text-sm font-bold bg-green-100/80 dark:bg-green-900/40 px-2 py-1 rounded-lg">✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>;
            })}
            </div>

            {/* Informação legal - Estilo iOS */}
            <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-900/60 p-4 rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <p className="font-medium leading-relaxed">
                Ao aceitar, você confirma ter 18+ anos ou autorização legal.
              </p>
            </div>

            {/* Botão principal - Estilo iOS - Movido para cima */}
            <div className="mt-6 mb-4">
              <Button onClick={handleAcceptAll} disabled={!allTermsAccepted} size="lg" className={`w-full h-14 text-base font-bold transition-all duration-300 rounded-2xl shadow-lg ${allTermsAccepted ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-200/50 dark:shadow-green-900/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-200/80 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60 backdrop-blur-sm'}`}>
                {allTermsAccepted ? <span className="flex items-center gap-2 tracking-tight">
                    ✅ Aceitar e Continuar
                  </span> : <span className="tracking-tight">
                    Aceitar Termos ({Object.values(acceptedTerms).filter(Boolean).length}/3)
                  </span>}
              </Button>
            </div>
          </CardContent>
        </ScrollArea>

        {/* Footer - Estilo iOS */}
        
      </DialogContent>
    </Dialog>;
};

// Hook para verificar se os termos foram aceitos
export const useTermsAcceptance = () => {
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const checkAcceptance = async () => {
      try {
        const stored = await getSecureItem('termsAcceptance');
        if (!stored) {
          setNeedsAcceptance(true);
          setIsLoading(false);
          return;
        }
        const acceptance = stored;
        const isValid = acceptance.privacy && acceptance.terms && acceptance.cookies;

        // Verificar se a aceitação não é muito antiga (opcional)
        const acceptanceDate = new Date(acceptance.timestamp);
        const daysSinceAcceptance = (Date.now() - acceptanceDate.getTime()) / (1000 * 60 * 60 * 24);

        // Se passou mais de 365 dias, pedir nova aceitação
        if (daysSinceAcceptance > 365) {
          setNeedsAcceptance(true);
        } else {
          setNeedsAcceptance(!isValid);
        }
      } catch (error) {
        console.error('Erro ao verificar aceitação de termos:', error);
        setNeedsAcceptance(true);
      } finally {
        setIsLoading(false);
      }
    };
    checkAcceptance();
  }, []);
  const markAsAccepted = () => {
    setNeedsAcceptance(false);
  };
  const clearAcceptance = () => {
    removeSecureItem('termsAcceptance');
    setNeedsAcceptance(true);
  };
  return {
    needsAcceptance,
    isLoading,
    markAsAccepted,
    clearAcceptance
  };
};