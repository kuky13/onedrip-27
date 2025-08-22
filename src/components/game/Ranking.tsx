import React from 'react';
import { useRanking } from '@/hooks/useRanking';
export const Ranking: React.FC = () => {
  const {
    rankings,
    isLoading,
    error
  } = useRanking();
  if (error) {
    return <div className="bg-gray-900 border border-green-400/30 rounded-lg p-4">
        <h3 className="text-lg font-bold text-red-400 mb-4">⚠️ Erro no Ranking</h3>
        <p className="text-sm text-gray-400">Falha ao carregar o ranking</p>
      </div>;
  }
  return <div className="bg-gray-900 border border-green-400/30 rounded-lg p-4">
      <h3 className="text-lg font-bold text-green-400 mb-4 text-center">
        🏆 Hall da Fama
      </h3>
      
      {isLoading ? <div className="space-y-2 animate-pulse">
          {Array.from({
        length: 5
      }).map((_, i) => <div key={i} className="h-8 bg-gray-700 rounded"></div>)}
        </div> : rankings.length === 0 ? <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-sm">Nenhuma pontuação ainda</p>
          <p className="text-xs">Seja o primeiro a vencer!</p>
        </div> : <div className="space-y-2">
          {rankings.map((entry, index) => <div key={entry.id} className={`flex items-center justify-between p-2 rounded ${index === 0 ? 'bg-yellow-900/30 border border-yellow-400/30' : index === 1 ? 'bg-gray-700/50' : index === 2 ? 'bg-orange-900/30' : 'bg-gray-800/30'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold w-6">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span className="text-white text-sm truncate max-w-24">
                  {entry.user_name}
                </span>
              </div>
              <div className="text-green-400 font-bold text-sm">
                {entry.score.toLocaleString()}
              </div>
            </div>)}
        </div>}
      
      <div className="mt-4 pt-4 border-t border-green-400/20 text-center">
        <p className="text-xs text-gray-400">Top 10 Programadores• Atualizado em Tempo Real</p>
      </div>
    </div>;
};