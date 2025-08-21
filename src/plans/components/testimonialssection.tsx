import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}
const testimonials: Testimonial[] = [{
  id: 1,
  name: "Maria Silva",
  role: "Empreendedora",
  content: "O OneDrip transformou completamente a gestão do meu negócio. Agora consigo acompanhar todos os orçamentos e vendas de forma organizada e profissional.",
  rating: 5
}, {
  id: 2,
  name: "João Santos",
  role: "Consultor",
  content: "A facilidade de criar orçamentos e a integração com WhatsApp me poupam horas de trabalho. Recomendo para qualquer profissional que queira se destacar.",
  rating: 5
}, {
  id: 3,
  name: "Ana Costa",
  role: "Freelancer",
  content: "Desde que comecei a usar o OneDrip, minha taxa de conversão de orçamentos aumentou significativamente. A plataforma é intuitiva e muito eficiente.",
  rating: 5
}];
const StarRating: React.FC<{
  rating: number;
}> = ({
  rating
}) => {
  return <div className="flex gap-1">
      {[...Array(5)].map((_, index) => <Star key={index} className={`w-4 h-4 ${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}
    </div>;
};
export const TestimonialsSection: React.FC = () => {
  return;
};
export default TestimonialsSection;