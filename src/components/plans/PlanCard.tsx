import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, MessageCircle } from 'lucide-react';
interface SiteSettings {
  plan_name: string;
  plan_description: string;
  plan_price: number;
  plan_currency: string;
  plan_period: string;
  plan_features: string[];
  popular_badge_text: string;
  cta_button_text: string;
  support_text: string;
  show_popular_badge: boolean;
  show_support_info: boolean;
}
interface PlanCardProps {
  config: SiteSettings;
  onPlanSelection: () => void;
}
export const PlanCard = ({
  config,
  onPlanSelection
}: PlanCardProps) => {
  return <section className="animate-fade-in-up" style={{
    animationDelay: '0.4s'
  }}>
      <div className="max-w-lg mx-auto">
        <Card className="card-interactive border-0 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500 interactive-glow">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl p-[1px]">
            <div className="bg-card/90 backdrop-blur-xl rounded-3xl h-full"></div>
          </div>
          
          <div className="relative z-10">
            {/* Popular badge */}
            {config.show_popular_badge && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 animate-bounce-in">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg mx-0 my-[26px] hover:scale-105 transition-transform duration-200">
                  <Star className="h-4 w-4 icon-bounce" />
                  {config.popular_badge_text}
                </div>
              </div>}

            <CardHeader className="text-center pt-12 pb-6">
              <CardTitle className="text-3xl lg:text-4xl text-foreground mb-3 animate-slide-down">
                {config.plan_name}
              </CardTitle>
              <CardDescription className="text-lg mb-6 text-muted-foreground animate-fade-in">
                {config.plan_description}
              </CardDescription>
              <div className="mb-8 animate-scale-in">
                <div className="flex items-baseline justify-center">
                  <span className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    {config.plan_currency} {config.plan_price}
                  </span>
                  <span className="text-xl text-muted-foreground ml-2">
                    {config.plan_period}
                  </span>
                </div>
                
              </div>
            </CardHeader>

            <CardContent className="space-y-8 px-8 pb-8">
              {/* Features List */}
              <div className="space-y-4">
                {config.plan_features.map((feature, index) => <div key={index} className="stagger-item flex items-center gap-4 p-2 rounded-lg hover:bg-accent/20 transition-all duration-200 hover:scale-[1.02]" style={{
                animationDelay: `${0.6 + index * 0.1}s`
              }}>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center flex-shrink-0 interactive-scale">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="text-foreground font-medium">{feature}</span>
                  </div>)}
              </div>

              {/* CTA Button */}
              <Button onClick={onPlanSelection} className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] interactive-glow" size="lg">
                {config.cta_button_text}
              </Button>

              {/* Support Info */}
              {config.show_support_info && <div className="text-center pt-6 border-t border-border/30 animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4 icon-glow" />
                    {config.support_text}
                  </div>
                </div>}
            </CardContent>
          </div>
        </Card>
      </div>
    </section>;
};