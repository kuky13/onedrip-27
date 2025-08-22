import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Shield, Users, Award, Star, CheckCircle, Clock, Target } from 'lucide-react';

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface BenefitsSectionProps {
  title?: string;
  subtitle?: string;
  benefits?: Benefit[];
  show?: boolean;
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    Zap, Shield, Users, Award, Star, CheckCircle, Clock, Target
  };
  return icons[iconName] || Zap;
};

const defaultBenefits: Benefit[] = [
  {
    icon: "Zap",
    title: "Rápido e Eficiente",
    description: "Crie orçamentos profissionais em menos de 2 minutos"
  },
  {
    icon: "Shield",
    title: "Seguro e Confiável", 
    description: "Seus dados protegidos com tecnologia de ponta"
  },
  {
    icon: "Users",
    title: "Suporte Dedicado",
    description: "Atendimento brasileiro via WhatsApp quando precisar"
  },
  {
    icon: "Award",
    title: "Resultados Comprovados",
    description: "Mais de 500+ assistências técnicas já confiam no OneDrip"
  }
];

export const BenefitsSection = ({ 
  title = "Vantagens do OneDrip", 
  subtitle = "Descubra os benefícios de usar nosso sistema",
  benefits = defaultBenefits,
  show = true 
}: BenefitsSectionProps) => {
  if (!show) return null;
  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      {(title || subtitle) && (
        <div className="text-center mb-12 animate-slide-down">
          {title && (
            <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-muted-foreground text-lg">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => {
          const Icon = getIconComponent(benefit.icon);
          return (
            <div 
              key={index} 
              className="stagger-item"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <Card className="card-interactive text-center group">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 mx-auto flex items-center justify-center mb-4 interactive-glow">
                    <Icon className="h-7 w-7 text-primary icon-bounce" />
                  </div>
                  <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
};