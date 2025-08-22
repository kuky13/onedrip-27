import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  faqs?: FAQ[];
  show?: boolean;
}

const defaultFaqs: FAQ[] = [
  {
    question: "Como funciona o período de teste?",
    answer: "Você tem 2 dias para testar todas as funcionalidades gratuitamente."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Não há fidelidade. Cancele quando quiser pelo WhatsApp."
  },
  {
    question: "O suporte está incluso?",
    answer: "Sim! Suporte completo via WhatsApp está incluído em todos os planos."
  },
  {
    question: "Funciona no celular?",
    answer: "Perfeitamente! O sistema é responsivo e funciona em qualquer dispositivo."
  }
];

export const FAQSection = ({ 
  title = "Perguntas Frequentes",
  subtitle = "Tire suas dúvidas sobre o OneDrip",
  faqs = defaultFaqs,
  show = true 
}: FAQSectionProps) => {
  if (!show) return null;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
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
      
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="stagger-item"
            style={{ animationDelay: `${0.8 + index * 0.1}s` }}
          >
            <Card className="card-interactive transition-all duration-300 hover:shadow-medium">
              <CardContent className="p-0">
                <button 
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} 
                  className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all duration-200 hover:bg-accent/10"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-foreground">{faq.question}</h4>
                    <div className={`transform transition-all duration-300 ${expandedFaq === index ? 'rotate-180 text-primary' : 'text-muted-foreground'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};