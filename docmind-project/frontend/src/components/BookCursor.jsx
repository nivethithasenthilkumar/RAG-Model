/**
 * BookCursor Component
 * Custom book cursor with glitter trail on movement
 */

import React, { useEffect, useRef, useState } from 'react';

export default function BookCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const idRef = useRef(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    let lastX = -100;
    let lastY = -100;
    let throttle = false;

    const handleMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      setPos({ x, y });

      // Throttle particle creation
      if (!throttle && (Math.abs(x - lastX) > 6 || Math.abs(y - lastY) > 6)) {
        throttle = true;
        lastX = x;
        lastY = y;

        // Spawn 2-4 glitter particles
        const count = Math.floor(Math.random() * 3) + 2;
        const newParticles = Array.from({ length: count }, () => {
          const id = ++idRef.current;
          const angle = Math.random() * Math.PI * 2;
          const distance = randomBetween(20, 50);
          return {
            id,
            x: x + randomBetween(-5, 5),
            y: y + randomBetween(-5, 5),
            size: randomBetween(3, 8),
            dx: Math.cos(angle) * distance + 'px',
            dy: Math.sin(angle) * distance + 'px',
            color: Math.random() > 0.5 ? getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() : '#fff',
          };
        });

        setParticles((prev) => [...prev.slice(-30), ...newParticles]);

        // Clean up after animation
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
        }, 850);

        setTimeout(() => { throttle = false; }, 40);
      }
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <>
      {/* Book cursor */}
      <div
        className="custom-cursor"
        style={{ left: pos.x, top: pos.y }}
      >
        <span className="cursor-book" role="img" aria-label="book">📖</span>
      </div>

      {/* Glitter trail particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="cursor-glitter-particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            '--dx': p.dx,
            '--dy': p.dy,
          }}
        />
      ))}
    </>
  );
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
