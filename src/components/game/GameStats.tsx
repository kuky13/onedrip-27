import React from 'react';
interface GameStatsProps {
  score: number;
  level: number;
  lives: number;
}
export const GameStats: React.FC<GameStatsProps> = ({
  score,
  level,
  lives
}) => {
  return <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-green-400/30 rounded-lg p-4 mb-4 shadow-lg">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-green-400/20">
          <div className="text-green-400 text-sm uppercase tracking-wide font-mono">Pontuação</div>
          <div className="text-3xl font-bold text-white bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {score.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3 border border-blue-400/20">
          <div className="text-blue-400 text-sm uppercase tracking-wide font-mono">Nível</div>
          <div className="text-3xl font-bold text-white">{level}</div>
          <div className="text-xs text-blue-300/70">
            {150 - score % 150} pts até próximo
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3 border border-red-400/20">
          <div className="text-red-400 text-sm uppercase tracking-wide font-mono">SISTEMA</div>
          <div className="flex justify-center gap-1 my-2">
            {Array.from({
            length: 5
          }).map((_, i) => <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${i < lives ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50 animate-pulse' : 'bg-gray-700 border-gray-600'}`} />)}
          </div>
          <div className={`text-xs font-bold ${lives >= 4 ? 'text-green-400' : lives >= 2 ? 'text-yellow-400' : 'text-red-400 animate-pulse'}`}>
            {lives >= 4 ? '✅ ESTÁVEL' : lives >= 2 ? '⚠️ ALERTA' : '🚨 CRÍTICO'}
          </div>
        </div>
      </div>
      
      {/* Enhanced bug legend */}
      <div className="mt-4 pt-4 border-t border-green-400/20 bg-gray-800/30 rounded-lg p-3">
        <div className="text-xs text-center space-y-2">
          <div className="font-mono text-green-400/80 mb-2">TIPOS DE AMEAÇAS</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>🐞 Bug</span>
                <span className="text-green-400 font-bold">+10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🔥 Crítico</span>
                <span className="text-red-400 font-bold">+25</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>💀 Vazamento</span>
                <span className="text-purple-400 font-bold">+50</span>
              </div>
              <div className="flex items-center justify-between">
                <span>⚡ Super Shock</span>
                <span className="text-cyan-400 font-bold">+200</span>
              </div>
            </div>
          </div>
          <div className="text-yellow-400 font-bold border-t border-yellow-400/20 pt-2">🐛 Apple BUG: +1000 pts</div>
          <div className="text-red-400/80 text-xs">
            ⚠️ Bugs que passam causam dano ao sistema
          </div>
        </div>
      </div>
    </div>;
};