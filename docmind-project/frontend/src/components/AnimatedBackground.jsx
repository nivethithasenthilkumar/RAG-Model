/**
 * AnimatedBackground Component
 * Renders glitter balls, blobs, and floating particles
 */

import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export default function AnimatedBackground() {
  const { isDarkMode } = useContext(ThemeContext);

  // Generate static ball configs once
  const balls = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      size: randomBetween(4, 14),
      left: randomBetween(0, 100),
      duration: randomBetween(6, 18),
      delay: randomBetween(0, 15),
      driftX: randomBetween(-60, 60),
      opacity: randomBetween(0.5, 1),
    }));
  }, []);

  const getBallStyle = (ball) => {
    const color = isDarkMode
      ? `hsl(${randomBetween(130, 160)}, 80%, ${randomBetween(55, 80)}%)`
      : ball.id % 3 === 0
      ? `rgba(255, 215, 0, ${ball.opacity})`
      : ball.id % 3 === 1
      ? `rgba(255, 255, 255, ${ball.opacity})`
      : `rgba(212, 175, 55, ${ball.opacity})`;

    return {
      width: `${ball.size}px`,
      height: `${ball.size}px`,
      left: `${ball.left}%`,
      bottom: '-20px',
      background: color,
      boxShadow: isDarkMode
        ? `0 0 ${ball.size * 2}px ${ball.size}px rgba(76, 217, 123, 0.4)`
        : `0 0 ${ball.size * 2}px ${ball.size}px rgba(255, 215, 0, 0.35)`,
      '--drift-x': `${ball.driftX}px`,
      animationDuration: `${ball.duration}s`,
      animationDelay: `${ball.delay}s`,
    };
  };

  return (
    <div className="dynamic-bg">
      {/* Large ambient blobs */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      {/* Tiny floating glitter balls */}
      {balls.map((ball) => (
        <div
          key={ball.id}
          className="float-ball"
          style={getBallStyle(ball)}
        />
      ))}
    </div>
  );
}
