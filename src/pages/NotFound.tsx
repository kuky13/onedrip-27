import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, MessageCircle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('Olá! Encontrei um erro 404 no sistema e preciso de ajuda.');
    const whatsappUrl = `https://wa.me/5564996028022?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-4xl font-bold text-destructive mb-2">404</CardTitle>
          <CardTitle className="text-xl text-foreground">Oops! Página não encontrada</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleWhatsAppContact}
              className="w-full"
              size="lg"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Contatar Suporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
