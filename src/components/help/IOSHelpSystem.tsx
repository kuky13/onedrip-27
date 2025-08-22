import React, { useState, useEffect } from 'react';
import { openWhatsApp } from '@/utils/whatsappUtils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchInput } from '@/components/ui/ios-optimized/SearchInput';
import { IOSMotion } from '@/components/ui/animations-ios';
import { useIOSOptimization } from '@/hooks/useIOSOptimization';
import { IOSFeedbackForm } from './IOSFeedbackForm';
import { IOSTutorialOverlay } from './IOSTutorialOverlay';
import { BookOpen, MessageCircle, Star, FileText, Lightbulb, HelpCircle, Filter, ArrowRight, ExternalLink, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpContent {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'advanced' | 'tutorial' | 'faq' | 'tips';
  tags: string[];
  icon?: string;
  steps?: Array<{
    title: string;
    description: string;
    target?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }>;
}

// Função de busca otimizada para iOS
function simpleSearch(text: string, query: string): boolean {
  if (!query) return true;
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalizedText.includes(normalizedQuery);
}

// Base de conhecimento otimizada
const knowledgeBase: HelpContent[] = [{
  id: 'getting-started',
  title: 'Primeiros Passos',
  description: 'Comece a usar o sistema rapidamente',
  category: 'tutorial',
  tags: ['início', 'básico', 'tutorial'],
  steps: [{
    title: 'Configure sua Empresa',
    description: 'Adicione as informações da sua empresa',
    position: 'bottom'
  }, {
    title: 'Crie seu Primeiro Orçamento',
    description: 'Aprenda a criar orçamentos completos',
    position: 'bottom'
  }]
}, {
  id: 'dashboard-guide',
  title: 'Usando o Dashboard',
  description: 'Entenda todas as métricas e funcionalidades',
  category: 'basic',
  tags: ['dashboard', 'métricas', 'relatórios']
}, {
  id: 'budget-management',
  title: 'Gestão de Orçamentos',
  description: 'Criar, editar e organizar orçamentos',
  category: 'basic',
  tags: ['orçamentos', 'gestão', 'organização']
}, {
  id: 'whatsapp-setup',
  title: 'WhatsApp Integration',
  description: 'Configure e use o compartilhamento automático',
  category: 'advanced',
  tags: ['whatsapp', 'compartilhamento', 'automação']
}, {
  id: 'productivity-tips',
  title: 'Dicas de Produtividade',
  description: 'Acelere seu trabalho com atalhos e funcionalidades',
  category: 'tips',
  tags: ['produtividade', 'atalhos', 'eficiência']
}];
const faqs = [{
  id: 'faq-1',
  question: 'Como criar meu primeiro orçamento?',
  answer: 'Acesse "Novo Orçamento" no menu, preencha os dados do cliente e dispositivo, adicione os serviços e valores.',
  tags: ['orçamento', 'criar', 'primeiro']
}, {
  id: 'faq-2',
  question: 'Como compartilhar via WhatsApp?',
  answer: 'Na lista de orçamentos, toque no botão do WhatsApp. O link será enviado automaticamente.',
  tags: ['whatsapp', 'compartilhar']
}, {
  id: 'faq-3',
  question: 'Como personalizar dados da empresa?',
  answer: 'Vá em Configurações > Dados da Empresa e preencha suas informações.',
  tags: ['empresa', 'personalizar', 'configurações']
}, {
  id: 'faq-4',
  question: 'O que significam os status?',
  answer: 'Pendente (aguardando), Aprovado (aceito), Rejeitado (recusado), Concluído (finalizado).',
  tags: ['status', 'orçamentos', 'fluxo']
}];
interface IOSHelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
}
export const IOSHelpSystem = ({
  isOpen,
  onClose,
  initialContext = 'dashboard'
}: IOSHelpSystemProps) => {
  const [activeTab, setActiveTab] = useState('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<HelpContent | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [currentTutorialContent, setCurrentTutorialContent] = useState<HelpContent | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const {
    isIOS,
    viewportHeight,
    safeAreaInsets
  } = useIOSOptimization();

  // Filtros otimizados
  const filteredContent = knowledgeBase.filter(content => {
    const matchesSearch = simpleSearch(content.title, searchQuery) || simpleSearch(content.description, searchQuery) || content.tags.some(tag => simpleSearch(tag, searchQuery));
    const matchesCategory = !activeCategory || content.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  const filteredFAQs = faqs.filter(faq => simpleSearch(faq.question, searchQuery) || simpleSearch(faq.answer, searchQuery) || faq.tags.some(tag => simpleSearch(tag, searchQuery)));
  const categories = [{
    id: 'basic',
    label: 'Básico',
    count: knowledgeBase.filter(c => c.category === 'basic').length
  }, {
    id: 'tutorial',
    label: 'Tutoriais',
    count: knowledgeBase.filter(c => c.category === 'tutorial').length
  }, {
    id: 'advanced',
    label: 'Avançado',
    count: knowledgeBase.filter(c => c.category === 'advanced').length
  }, {
    id: 'tips',
    label: 'Dicas',
    count: knowledgeBase.filter(c => c.category === 'tips').length
  }];
  const handleWhatsAppSupport = () => {
    openWhatsApp('https://wa.me/556496028022');
  };
  const clearSearch = () => {
    setSearchQuery('');
  };
  const handleContentSelect = (content: HelpContent) => {
    setSelectedContent(content);
  };
  const handleBackToList = () => {
    setSelectedContent(null);
  };
  const handleStartTutorial = (content?: HelpContent) => {
    const tutorialContent = content || knowledgeBase.find(c => c.id === 'getting-started');
    if (tutorialContent) {
      setCurrentTutorialContent(tutorialContent);
      setShowTutorial(true);
      setTutorialStep(0);
      onClose();
    }
  };
  const handleNextTutorialStep = () => {
    setTutorialStep(prev => prev + 1);
  };
  const handlePrevTutorialStep = () => {
    setTutorialStep(prev => Math.max(0, prev - 1));
  };
  const handleFinishTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    setCurrentTutorialContent(null);
  };
  const handleShowFeedback = () => {
    setShowFeedback(true);
  };
  const handleCloseFeedback = () => {
    setShowFeedback(false);
  };

  // Limpar estado quando fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedContent(null);
      setShowFeedback(false);
      setActiveCategory(null);
    }
  }, [isOpen]);
  return <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className={cn("p-0 border-t rounded-t-xl", isIOS && "pb-[env(safe-area-inset-bottom)]")} style={{
      height: isIOS ? '85dvh' : '85vh',
      maxHeight: isIOS ? '85dvh' : '85vh'
    }}>
        <IOSMotion animation="slideUp" className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="p-4 pb-3 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              {selectedContent || showFeedback ? <Button variant="ghost" size="sm" onClick={showFeedback ? handleCloseFeedback : handleBackToList} className="p-2 -ml-2">
                  <ChevronLeft className="h-5 w-5" />
                </Button> : <div className="w-9" />}
              
              <SheetTitle className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {showFeedback ? 'Feedback' : selectedContent ? 'Guia' : 'Central de Ajuda'}
              </SheetTitle>
              
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2 -mr-2">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showFeedback ? (
              <IOSFeedbackForm onClose={handleCloseFeedback} context={initialContext} />
            ) : selectedContent ? (
              <IOSMotion animation="fadeSlide" className="h-full p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{selectedContent.title}</h2>
                      <p className="text-muted-foreground mb-4">{selectedContent.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedContent.steps && (
                      <div className="space-y-4">
                        <h3 className="font-medium">Passo a passo:</h3>
                        {selectedContent.steps.map((step, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium mb-1">{step.title}</h4>
                                  <p className="text-sm text-muted-foreground">{step.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </IOSMotion>
            ) : (
              <div className="h-full flex flex-col">
                {/* Search */}
                <div className="p-4 pb-0">
                  <SearchInput value={searchQuery} onChange={setSearchQuery} onClear={clearSearch} placeholder="Buscar ajuda..." className="mb-4" />
                </div>

                {/* Tabs */}
                <div className="flex-1 overflow-hidden">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mx-4 mb-4">
                      <TabsTrigger value="quick" className="text-xs">
                        Rápido
                      </TabsTrigger>
                      
                      <TabsTrigger value="faq" className="text-xs">
                        FAQ
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden">
                      <TabsContent value="quick" className="h-full mt-0">
                        <ScrollArea className="h-full px-4">
                          <div className="space-y-4 pb-4">
                            {/* Quick Actions */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Ações Rápidas</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                
                                <Button variant="outline" className="w-full justify-start gap-3" onClick={handleWhatsAppSupport} style={{
                              touchAction: 'manipulation'
                            }}>
                                  <MessageCircle className="h-4 w-4" />
                                  WhatsApp
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-3" onClick={handleShowFeedback} style={{
                              touchAction: 'manipulation'
                            }}>
                                  <Star className="h-4 w-4" />
                                  Enviar Feedback
                                </Button>
                              </CardContent>
                            </Card>

                            {/* Quick FAQs */}
                            <div className="space-y-3">
                              <h3 className="font-medium text-sm px-1">Perguntas Frequentes</h3>
                              {filteredFAQs.slice(0, 4).map(faq => (
                              <Card key={faq.id} className="border-l-4 border-l-primary/20">
                                <CardContent className="p-4">
                                  <h4 className="font-medium text-sm mb-2">{faq.question}</h4>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                                </CardContent>
                              </Card>
                            ))}
                            </div>
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="guides" className="h-full mt-0">
                        <div className="h-full flex flex-col">
                          {/* Categories */}
                          <div className="px-4 mb-4">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              <Button variant={activeCategory ? "outline" : "default"} size="sm" onClick={() => setActiveCategory(null)} className="whitespace-nowrap">
                                Todos
                              </Button>
                              {categories.map(category => (
                                <Button key={category.id} variant={activeCategory === category.id ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(category.id)} className="whitespace-nowrap gap-2">
                                  {category.label}
                                  <Badge variant="secondary" className="text-xs">
                                    {category.count}
                                  </Badge>
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Content List */}
                          <ScrollArea className="flex-1 px-4">
                            <div className="space-y-3 pb-4">
                              {filteredContent.map(content => (
                                <IOSMotion key={content.id} animation="fadeSlide">
                                  <Card className="active:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleContentSelect(content)} style={{
                              touchAction: 'manipulation'
                            }}>
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-medium text-sm">{content.title}</h3>
                                            <Badge variant={content.category === 'tutorial' ? 'default' : 'secondary'} className="text-xs">
                                              {content.category}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                                            {content.description}
                                          </p>
                                          <div className="flex gap-1 flex-wrap">
                                            {content.tags.slice(0, 2).map(tag => (
                                              <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-3 flex-shrink-0" />
                                      </div>
                                    </CardContent>
                                  </Card>
                                </IOSMotion>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </TabsContent>

                      <TabsContent value="faq" className="h-full mt-0">
                        <ScrollArea className="h-full px-4">
                          <div className="space-y-3 pb-4">
                            {filteredFAQs.map(faq => (
                              <IOSMotion key={faq.id} animation="fadeSlide">
                                <Card>
                                  <CardContent className="p-4">
                                    <h3 className="font-medium text-sm mb-2">{faq.question}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{faq.answer}</p>
                                    <div className="flex gap-1 flex-wrap">
                                      {faq.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </IOSMotion>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </IOSMotion>
      </SheetContent>
      
      {/* Tutorial Overlay */}
      <IOSTutorialOverlay isVisible={showTutorial} content={currentTutorialContent} currentStep={tutorialStep} onNext={handleNextTutorialStep} onPrev={handlePrevTutorialStep} onClose={handleFinishTutorial} onComplete={handleFinishTutorial} />
    </Sheet>;
};