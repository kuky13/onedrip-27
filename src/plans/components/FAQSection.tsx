import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PerguntaFrequente {
  pergunta: string;
  resposta: string;
}

interface FAQSectionProps {
  mostrar: boolean;
  titulo: string;
  subtitulo: string;
  perguntas: PerguntaFrequente[];
}

export const FAQSection = ({ mostrar, titulo, subtitulo, perguntas }: FAQSectionProps) => {
  if (!mostrar) return null;

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
      <div className="text-center mb-16">
        <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
          {titulo}
        </h3>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {subtitulo}
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-4">
          {perguntas.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border rounded-2xl px-6 glass backdrop-blur-xl"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {item.pergunta}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                {item.resposta}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};