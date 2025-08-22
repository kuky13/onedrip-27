import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IOSMotion } from '@/components/ui/animations-ios';
import { Star, Send, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IOSFeedbackFormProps {
  onClose: () => void;
  context?: string;
}

export const IOSFeedbackForm = ({ onClose, context = 'dashboard' }: IOSFeedbackFormProps) => {
  const [rating, setRating] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!rating || !feedback.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione uma avaliação e escreva seu feedback.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simular envio de feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Feedback enviado!",
        description: "Obrigado pelo seu feedback. Vamos analisar e melhorar nossa plataforma.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar seu feedback. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingOptions = [
    { value: '5', label: 'Excelente', emoji: '🌟' },
    { value: '4', label: 'Bom', emoji: '😊' },
    { value: '3', label: 'Regular', emoji: '😐' },
    { value: '2', label: 'Ruim', emoji: '😞' },
    { value: '1', label: 'Muito Ruim', emoji: '😡' }
  ];

  return (
    <IOSMotion animation="slideUp" className="h-full">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 -ml-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h2 className="text-lg font-semibold">Enviar Feedback</h2>
          
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Como você avalia nossa plataforma?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={rating} onValueChange={setRating}>
                <div className="space-y-3">
                  {ratingOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={option.value} 
                        id={`rating-${option.value}`}
                        className="w-5 h-5"
                      />
                      <Label 
                        htmlFor={`rating-${option.value}`}
                        className="flex items-center gap-2 cursor-pointer flex-1 py-2"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="text-base">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conte-nos mais</CardTitle>
              <p className="text-sm text-muted-foreground">
                Seu feedback nos ajuda a melhorar a plataforma
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Descreva sua experiência, sugestões ou problemas encontrados..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="resize-none text-base"
                style={{
                  fontSize: '16px', // Previne zoom no iOS
                  WebkitAppearance: 'none'
                }}
              />
              <div className="mt-2 flex justify-between items-center">
                <Badge variant="outline" className="text-xs">
                  Contexto: {context}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {feedback.length}/500
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !rating || !feedback.trim()}
            className="w-full gap-2"
            style={{ touchAction: 'manipulation' }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Feedback
              </>
            )}
          </Button>
        </div>
      </div>
    </IOSMotion>
  );
};