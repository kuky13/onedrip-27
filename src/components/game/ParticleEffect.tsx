import React from 'react';
import { motion } from 'framer-motion';

interface ParticleEffectProps {
  x: number;
  y: number;
  type: 'bug' | 'critical-bug' | 'memory-leak' | 'boss-bug' | 'speed-bug';
  onComplete: () => void;
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({ x, y, type, onComplete }) => {
  const getParticleColor = (type: string) => {
    switch (type) {
      case 'critical-bug': return 'bg-red-400';
      case 'memory-leak': return 'bg-purple-400';
      case 'boss-bug': return 'bg-yellow-400';
      case 'speed-bug': return 'bg-cyan-400';
      default: return 'bg-green-400';
    }
  };

  const particles = Array.from({ length: type === 'boss-bug' ? 12 : 6 }, (_, i) => ({
    id: i,
    angle: (360 / (type === 'boss-bug' ? 12 : 6)) * i,
    delay: i * 0.05,
  }));

  return (
    <div 
      className="absolute pointer-events-none z-20"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute w-2 h-2 rounded-full ${getParticleColor(type)}`}
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1
          }}
          animate={{ 
            scale: [0, 1, 0],
            x: Math.cos(particle.angle * Math.PI / 180) * 50,
            y: Math.sin(particle.angle * Math.PI / 180) * 50,
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 0.6,
            delay: particle.delay,
            ease: "easeOut"
          }}
          onAnimationComplete={() => {
            if (particle.id === particles.length - 1) {
              onComplete();
            }
          }}
        />
      ))}
      
      {/* Central explosion effect */}
      <motion.div
        className={`absolute w-8 h-8 rounded-full ${getParticleColor(type)} opacity-50`}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      
      {/* Score popup */}
      <motion.div
        className="absolute text-white font-bold text-lg pointer-events-none"
        initial={{ y: 0, opacity: 0, scale: 0.5 }}
        animate={{ y: -30, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        +{type === 'boss-bug' ? '1000' : 
            type === 'speed-bug' ? '200' : 
            type === 'memory-leak' ? '50' : 
            type === 'critical-bug' ? '25' : '10'}
      </motion.div>
    </div>
  );
};