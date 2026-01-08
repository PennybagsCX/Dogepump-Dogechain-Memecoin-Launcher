import React, { useEffect, useRef } from 'react';

export const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#D4AF37', '#F4C430', '#FFFFFF', '#00E054'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        w: Math.random() * 10 + 5,
        h: Math.random() * 10 + 5,
        dx: (Math.random() - 0.5) * 20,
        dy: (Math.random() - 0.5) * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.5,
        drag: 0.96,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        p.dy += p.gravity;
        p.dx *= p.drag;
        p.dy *= p.drag;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        if (p.y > canvas.height) {
          particles.splice(i, 1);
        }
      });

      if (particles.length > 0) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
};