import React, { useState } from 'react';
import { useRanking } from '@/hooks/useRanking';
import { useAuth } from '@/hooks/useAuth';

interface GameOverProps {
  score: number;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  score,
  onRestart
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { submitScore } = useRanking();
  const { profile } = useAuth();
  
  const handleSubmitScore = async () => {
    if (isSubmitting || !profile) return;
    setIsSubmitting(true);
    try {
      await submitScore(score);
      setHasSubmitted(true);
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-gray-900 border-2 border-red-400 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">💥</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Erro 404</h2>
          <p className="text-green-400 mb-6">
            Pontuação Final: <span className="text-white font-bold text-xl">{score.toLocaleString()}</span>
          </p>

          {!hasSubmitted ? (
            <div className="space-y-4">
              <div className="text-center text-green-400 mb-4">
                🎯 Salvar pontuação como: <span className="text-white font-bold">{profile?.name}</span>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleSubmitScore} 
                  disabled={isSubmitting} 
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-bold transition-colors"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Pontuação'}
                </button>
                <button onClick={onRestart} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-bold transition-colors">
                  Pular
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-green-400">
                ✅ Pontuação enviada com sucesso!
              </div>
              <button onClick={onRestart} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition-colors">
                DEBUGAR NOVAMENTE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};