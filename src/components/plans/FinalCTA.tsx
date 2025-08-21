import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface FinalCTAProps {
  additionalInfo: string;
  ctaButtonText: string;
  onPlanSelection: () => void;
}

export const FinalCTA = ({ additionalInfo, ctaButtonText, onPlanSelection }: FinalCTAProps) => {
  return (
    <section className="text-center animate-fade-in-up" style={{ animationDelay: '1s' }}>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-12 glass backdrop-blur-xl">
        <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
          Pronto para revolucionar sua assistência técnica?
        </h3>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {additionalInfo}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button onClick={onPlanSelection} className="btn-premium text-lg px-8 py-4">
            {ctaButtonText}
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