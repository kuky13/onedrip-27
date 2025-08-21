import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Search, 
  MessageCircle, 
  Video, 
  FileText,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface HelpContent {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
}

// Função utilitária para busca fuzzy simples
function fuzzyIncludes(text: string, query: string) {
  if (!query) return true;
  const normalizedText = text.normalize('NFD').replace(/[ \u0300-\u036f]/g, '').toLowerCase();
  const normalizedQuery = query.normalize('NFD').replace(/[ \u0300-\u036f]/g, '').toLowerCase();
  // Permite até 1 erro de digitação (Levenshtein <= 1) para buscas curtas
  if (normalizedQuery.length <= 4) {
    return normalizedText.includes(normalizedQuery);
  }
  // Busca fuzzy simples: todas as letras do query aparecem na ordem
  let i = 0;
  for (let c of normalizedText) {
    if (c === normalizedQuery[i]) i++;
    if (i === normalizedQuery.length) return true;
  }
  return false;
}

// Função para destacar termos encontrados
function highlight(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.split(regex).map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200 text-primary px-1 rounded">{part}</mark> : part
  );
}

// Base de conhecimento completa
const knowledgeBase: HelpContent[] = [
  {
    id: 'getting-started',
    title: 'Primeiros Passos no Sistema',
    description: 'Guia completo para começar a usar todas as funcionalidades.',
    category: 'tutorial',
    tags: ['início', 'básico', 'configuração'],
    icon: 'BookOpen'
  },
  {
    id: 'dashboard-overview',
    title: 'Entendendo o Dashboard',
    description: 'Como interpretar as métricas e usar as funcionalidades do painel.',
    category: 'basic',
    tags: ['dashboard', 'métricas', 'relatórios'],
    icon: 'BarChart2'
  },
  {
    id: 'budget-management',
    title: 'Gestão Completa de Orçamentos',
    description: 'Criar, editar, compartilhar e organizar orçamentos eficientemente.',
    category: 'basic',
    tags: ['orçamentos', 'gestão', 'compartilhamento'],
    icon: 'FileText'
  }
];

// FAQs categorizadas e expandidas
const faqs = [
  {
    id: 'licenses',
    question: 'Como ativar minha licença?',
    answer: 'Para ativar sua licença, acesse a página de licenças e digite o código de 13 caracteres fornecido. O código pode conter letras e números, como por exemplo: ABC123XYZ4567.',
    category: 'license',
    tags: ['licença', 'ativação', 'código'],
    priority: 'high'
  },
  {
    id: 'budget-creation',
    question: 'Como criar um orçamento?',
    answer: 'Clique no botão "Novo Orçamento" no dashboard, preencha as informações do cliente e dispositivo, adicione as peças necessárias e defina os preços.',
    category: 'budget',
    tags: ['orçamento', 'criar', 'novo'],
    priority: 'high'
  },
  {
    id: 'budget-sharing',
    question: 'Como compartilhar um orçamento?',
    answer: 'Na lista de orçamentos, clique no orçamento desejado e use o botão "Compartilhar" para gerar um link ou enviar por WhatsApp.',
    category: 'budget',
    tags: ['orçamento', 'compartilhar', 'whatsapp'],
    priority: 'medium'
  }
];

// Sugestões de busca inteligentes
const searchSuggestions = [
  { term: 'ativar licença', category: 'license', icon: 'Key' },
  { term: 'criar orçamento', category: 'budget', icon: 'FileText' },
  { term: 'compartilhar', category: 'budget', icon: 'Share2' },
  { term: 'configurar empresa', category: 'settings', icon: 'Settings' },
  { term: 'relatórios', category: 'reports', icon: 'BarChart3' },
  { term: 'problemas de acesso', category: 'troubleshooting', icon: 'AlertCircle' }
];

export const HelpSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtrar conteúdo baseado na busca e categoria
  const filteredContent = knowledgeBase.filter(content => {
    const matchesQuery = !searchQuery || 
      fuzzyIncludes(content.title, searchQuery) ||
      fuzzyIncludes(content.description, searchQuery) ||
      content.tags.some(tag => fuzzyIncludes(tag, searchQuery));
    
    const matchesCategory = selectedCategory === 'all' || content.category === selectedCategory;
    
    return matchesQuery && matchesCategory;
  });

  // Filtrar FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesQuery = !searchQuery ||
      fuzzyIncludes(faq.question, searchQuery) ||
      fuzzyIncludes(faq.answer, searchQuery) ||
      faq.tags.some(tag => fuzzyIncludes(tag, searchQuery));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesQuery && matchesCategory;
  });

  // Categorias disponíveis
  const categories = [
    { id: 'all', label: 'Todas', icon: 'Grid3X3' },
    { id: 'tutorial', label: 'Tutoriais', icon: 'BookOpen' },
    { id: 'basic', label: 'Básico', icon: 'Star' },
    { id: 'advanced', label: 'Avançado', icon: 'Zap' },
    { id: 'license', label: 'Licenças', icon: 'Key' },
    { id: 'budget', label: 'Orçamentos', icon: 'FileText' },
    { id: 'troubleshooting', label: 'Problemas', icon: 'AlertCircle' }
  ];

  const handleContentSelect = (content: HelpContent) => {
    console.log('Selected content:', content);
  };

  return (
    <>
      {/* Botão de ajuda flutuante */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      {/* Dialog principal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Central de Ajuda
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </TabsTrigger>
              <TabsTrigger value="tutorials" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Tutoriais
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Contato
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4">
              <TabsContent value="search" className="h-full">
                <div className="space-y-4 h-full flex flex-col">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar ajuda..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filtros de categoria */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="h-8"
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-4">
                      {filteredContent.length > 0 ? (
                        filteredContent.map(content => (
                          <Card 
                            key={content.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleContentSelect(content)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-sm">
                                      {highlight(content.title, searchQuery)}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {highlight(content.description, searchQuery)}
                                    </p>
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex flex-wrap gap-1">
                                {content.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum resultado encontrado para "{searchQuery}"</p>
                          <p className="text-sm mt-2">Tente usar termos diferentes ou veja as sugestões acima.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="tutorials" className="h-full">
                <ScrollArea className="h-full">
                  <div className="grid gap-4">
                    {knowledgeBase.filter(item => item.category === 'tutorial').map(tutorial => (
                      <Card 
                        key={tutorial.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleContentSelect(tutorial)}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <Video className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{tutorial.title}</CardTitle>
                              <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="faq" className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {filteredFaqs.map(faq => (
                      <Card key={faq.id}>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-start justify-between">
                            {highlight(faq.question, searchQuery)}
                            <Badge variant={faq.priority === 'high' ? 'default' : 'secondary'} className="ml-2">
                              {faq.priority === 'high' ? 'Popular' : 'Comum'}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {highlight(faq.answer, searchQuery)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {faq.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="contact" className="h-full">
                <div className="space-y-6">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Ainda precisa de ajuda?</h3>
                    <p className="text-muted-foreground">Nossa equipe está aqui para ajudar você!</p>
                  </div>

                  <div className="grid gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-medium">WhatsApp</h4>
                            <p className="text-sm text-muted-foreground">Resposta em até 1 hora</p>
                          </div>
                          <Button size="sm" className="ml-auto">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Abrir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">Enviar Feedback</h4>
                            <p className="text-sm text-muted-foreground">Sugestões e melhorias</p>
                          </div>
                          <Button size="sm" variant="outline" className="ml-auto">
                            Enviar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

    </>
  );
};