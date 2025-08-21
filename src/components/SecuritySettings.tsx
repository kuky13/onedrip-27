
import { openWhatsApp } from '@/utils/whatsappUtils';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, MessageCircle, Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';


export const SecuritySettings = () => {
  const handleSupportContact = () => {
    openWhatsApp('https://wa.me/556496028022');
  };
  return <Card style={{
    animationDelay: '100ms'
  }} className="glass-card animate-scale-in card-hover py-0 px-0 my-[11px] mx-0">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Segurança
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Alterar Email</p>
                <p className="text-sm text-muted-foreground">
                  Altere seu endereço de email de acesso.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700">
              <Link to="/reset-email">
                Alterar
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Alterar Senha</p>
                <p className="text-sm text-muted-foreground">
                  Altere sua senha de acesso para mais segurança.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 hover:text-yellow-700">
              <Link to="/reset-password">
                Alterar
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  Entre em contato com nosso suporte
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSupportContact} className="text-green-600 border-green-600 hover:bg-green-50">
              Contatar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};
