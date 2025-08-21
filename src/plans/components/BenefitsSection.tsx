import React from 'react';
import { Zap, Shield, Users, Award } from 'lucide-react';

// Mapeamento dos ícones disponíveis
const ICONES = {
  Zap,
  Shield, 
  Users,
  Award
};

interface Vantagem {
  icone: keyof typeof ICONES;
  titulo: string;
  descricao: string;
}

interface BenefitsSectionProps {
  mostrar: boolean;
  titulo: string;
  subtitulo: string;
  vantagens: Vantagem[];
}

export const BenefitsSection = ({ mostrar, titulo, subtitulo, vantagens }: BenefitsSectionProps) => {
  if (!mostrar) return null;

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="text-center mb-16">
        <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
          {titulo}
        </h3>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {subtitulo}
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {vantagens.map((vantagem, index) => {
          const IconeComponente = ICONES[vantagem.icone];
          
          return (
            <div 
              key={index}
              className="text-center group hover:scale-105 transition-all duration-300"
            >
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <IconeComponente className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-foreground">
                {vantagem.titulo}
              </h4>
              <p className="text-muted-foreground">
                {vantagem.descricao}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};