import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-destructive/10 rounded-full">
            <Shield className="w-12 h-12 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Acesso Negado
        </h1>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Você não tem permissão para acessar esta página. 
          Entre em contato com o administrador se acredita que isso é um erro.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/auth')}
            className="w-full"
            size="lg"
          >
            Fazer Login com Outra Conta
          </Button>
        </div>
      </div>
    </div>
  );
};