// ============================================
// COMPONENTE PIX OTIMIZADO
// ============================================
// Interface otimizada para pagamentos PIX com melhor UX

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Timer, RefreshCw, AlertCircle, Smartphone, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PixCode } from '../../../shared/types/pix';

interface PixPaymentOptimizedProps {
  pixCode: PixCode;
  planName: string;
  amount: number;
  expiresAt: Date;
  onPaymentComplete?: () => void;
  onExpired?: () => void;
  className?: string;
}

export const PixPaymentOptimized: React.FC<PixPaymentOptimizedProps> = ({
  pixCode,
  planName,
  amount,
  expiresAt,
  onPaymentComplete,
  onExpired,
  className
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    percentage: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, percentage: 100 });
  
  const [qrCodeExpanded, setQrCodeExpanded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'expired'>('pending');

  // Calcular tempo restante
  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const difference = expiry - now;
    
    if (difference <= 0) {
      setPaymentStatus('expired');
      onExpired?.();
      return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, percentage: 0 };
    }

    const totalOriginalTime = 24 * 60 * 60; // 24 horas em segundos
    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const percentage = (totalSeconds / totalOriginalTime) * 100;

    return { hours, minutes, seconds, totalSeconds, percentage };
  }, [expiresAt, onExpired]);

  // Timer para atualizar countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Calcular tempo inicial
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Copiar código PIX
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixCode.code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar código PIX');
    }
  }, [pixCode.code]);

  // Verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    setPaymentStatus('checking');
    
    // Simular verificação de status
    setTimeout(() => {
      setPaymentStatus('pending');
      toast.info('Pagamento ainda pendente. Aguardando confirmação.');
    }, 2000);
  }, []);

  // Memoizar formatação de tempo
  const formattedTime = useMemo(() => {
    if (timeLeft.totalSeconds <= 0) return '00:00:00';
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;
  }, [timeLeft]);

  // Determinar cor do progresso
  const progressColor = useMemo(() => {
    if (timeLeft.percentage > 50) return 'bg-green-500';
    if (timeLeft.percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [timeLeft.percentage]);

  // Status badge
  const StatusBadge = () => (
    <Badge 
      variant={paymentStatus === 'expired' ? 'destructive' : 'default'}
      className={cn(
        'animate-pulse',
        paymentStatus === 'pending' && 'bg-blue-500',
        paymentStatus === 'checking' && 'bg-yellow-500'
      )}
    >
      {paymentStatus === 'pending' && 'Aguardando Pagamento'}
      {paymentStatus === 'checking' && 'Verificando...'}
      {paymentStatus === 'expired' && 'Expirado'}
    </Badge>
  );

  if (paymentStatus === 'expired') {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-red-600">PIX Expirado</CardTitle>
          <CardDescription>
            Este código PIX expirou. Gere um novo código para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
            variant="outline"
          >
            Gerar Novo Código PIX
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div>
          <CardTitle className="text-xl font-bold mb-2">Pagamento PIX</CardTitle>
          <CardDescription>{planName}</CardDescription>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            R$ {amount.toFixed(2)}
          </div>
          <StatusBadge />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Countdown Timer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Tempo restante
            </span>
            <span className="font-mono font-bold">{formattedTime}</span>
          </div>
          
          <Progress 
            value={timeLeft.percentage} 
            className="h-2"
          />
          
          <div className="text-xs text-muted-foreground text-center">
            Este código expira automaticamente em {formattedTime}
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center space-y-4">
          <AnimatePresence mode="wait">
            {!qrCodeExpanded ? (
              <motion.div
                key="qr-compact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <Button
                  variant="outline"
                  onClick={() => setQrCodeExpanded(true)}
                  className="w-full flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Mostrar QR Code para Celular
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="qr-expanded"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-3"
              >
                {pixCode.qrCodeBase64 ? (
                  <div className="p-4 bg-white rounded-lg border">
                    <img
                      src={`data:image/png;base64,${pixCode.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-500">QR Code não disponível</span>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQrCodeExpanded(false)}
                  className="text-xs"
                >
                  Ocultar QR Code
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Código PIX */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Código PIX:</div>
          
          <div className="relative">
            <div className="p-3 bg-gray-50 rounded-lg border font-mono text-sm break-all pr-12">
              {pixCode.code}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyCode}
              className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 p-0"
              disabled={!pixCode.code}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Como pagar:</div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="font-bold text-primary min-w-[20px]">1.</span>
              <span>Abra seu app do banco ou carteira digital</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary min-w-[20px]">2.</span>
              <span>Escaneie o QR Code ou copie o código PIX</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary min-w-[20px]">3.</span>
              <span>Confirme o pagamento de R$ {amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={checkPaymentStatus}
            disabled={paymentStatus === 'checking'}
            className="flex-1 flex items-center gap-2"
          >
            {paymentStatus === 'checking' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Verificar Pagamento
              </>
            )}
          </Button>
        </div>

        {/* Informações adicionais */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <div>O pagamento será confirmado automaticamente</div>
          <div>Em caso de dúvidas, entre em contato conosco</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PixPaymentOptimized;