import React from 'react';

interface PlansHeroProps {
  pageTitle: string;
  pageSubtitle: string;
}

export const PlansHero = ({ pageTitle, pageSubtitle }: PlansHeroProps) => {
  return (
    <section className="text-center animate-fade-in-up">
      <div className="flex items-center justify-center space-x-3 mb-8">
        <img 
          alt="OneDrip Logo" 
          className="h-16 w-16 interactive-scale" 
          src="/lovable-uploads/logoo.png"
          loading="lazy"
        />
        <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          OneDrip
        </h1>
      </div>
      <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
        {pageTitle}
      </h2>
      <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
        {pageSubtitle}
      </p>
    </section>
  );
};