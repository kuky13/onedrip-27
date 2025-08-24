import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface FinalCTAProps {
  titulo: string;
  informacoesExtras: string;
  botaoTexto: string;
  aoSelecionarPlano: () => void;
  isProcessing?: boolean;
}

export const FinalCTA = ({ titulo, informacoesExtras, botaoTexto, aoSelecionarPlano, isProcessing = false }: FinalCTAProps) => {
  return (
    <section className="text-center animate-fade-in-up" style={{ animationDelay: '1s' }}>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-12 glass backdrop-blur-xl">
        <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
          {titulo}
        </h3>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {informacoesExtras}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={aoSelecionarPlano} 
            disabled={isProcessing}
            className="btn-premium text-lg px-8 py-4"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              botaoTexto
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/auth" className="font-semibold text-primary hover:underline">
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};