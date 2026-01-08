
import React, { useEffect, useState, useRef } from 'react';
import { User, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Holder {
  address: string;
  percentage: number;
  color: string;
  isYou?: boolean;
  isContract?: boolean;
}

interface BubbleMapProps {
  holders: Holder[];
}

interface Bubble extends Holder {
  x: number;
  y: number;
  r: number; // Radius
  targetR: number; // Target Radius for smooth transition
  vx: number;
  vy: number;
}

const BubbleMapComponent: React.FC<BubbleMapProps> = ({ holders }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const requestRef = useRef<number>(null);
  const navigate = useNavigate();
  
  // Interaction Refs
  const draggingBubbleIdx = useRef<number | null>(null);
  const lastMousePos = useRef<{x: number, y: number} | null>(null);
  const isDragging = useRef<boolean>(false);
  const startMousePos = useRef<{x: number, y: number} | null>(null);

  // Initialize & Reconcile Bubbles
  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    setBubbles(prevBubbles => {
        const newBubbles: Bubble[] = [];
        
        // Map over new props
        holders.forEach((h, i) => {
            const targetRadius = Math.max(20, Math.sqrt(h.percentage) * 15);
            
            // Try to find existing bubble for this address to maintain position
            const existing = prevBubbles.find(b => b.address === h.address);
            
            if (existing) {
                newBubbles.push({
                    ...existing,
                    ...h, // Update data
                    targetR: targetRadius, // Update target size
                });
            } else {
                // New bubble gets random pos
                newBubbles.push({
                    ...h,
                    x: i === 0 ? width / 2 : Math.random() * width,
                    y: i === 0 ? height / 2 : Math.random() * height,
                    r: 0, // Start small and grow
                    targetR: targetRadius,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                });
            }
        });
        return newBubbles;
    });

  }, [holders]);

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
      // Prevent navigation on drag start
      draggingBubbleIdx.current = index;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      startMousePos.current = { x: e.clientX, y: e.clientY };
      isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
      if (draggingBubbleIdx.current !== null && lastMousePos.current && startMousePos.current) {
          const dx = e.clientX - lastMousePos.current.x;
          const dy = e.clientY - lastMousePos.current.y;
          
          // Check if moved enough to be considered a drag
          const totalDist = Math.sqrt(Math.pow(e.clientX - startMousePos.current.x, 2) + Math.pow(e.clientY - startMousePos.current.y, 2));
          if (totalDist > 5) {
              isDragging.current = true;
          }

          setBubbles(prev => prev.map((b, i) => {
              if (i === draggingBubbleIdx.current) {
                  return { ...b, x: b.x + dx, y: b.y + dy, vx: 0, vy: 0 };
              }
              return b;
          }));
          
          lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleMouseUp = () => {
      draggingBubbleIdx.current = null;
      lastMousePos.current = null;
      // Note: We do NOT reset isDragging.current here. 
      // It is checked in handleClick.
  };

  useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, []);

  // Physics Simulation Loop
  const update = () => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const center = { x: width / 2, y: height / 2 };

    setBubbles(prevBubbles => {
      return prevBubbles.map((b, i) => {
        // Skip physics update for position if being dragged
        if (i === draggingBubbleIdx.current) {
            // Still update radius
            let { r, targetR } = b;
            if (r !== targetR) r += (targetR - r) * 0.1;
            return { ...b, r }; 
        }

        let { x, y, vx, vy, r, targetR } = b;

        // Smoothly interpolate radius
        if (r !== targetR) {
            r += (targetR - r) * 0.1;
        }

        // 1. Attraction to center (Gravity)
        const dx = center.x - x;
        const dy = center.y - y;
        // Stronger gravity for the main bubble (index 0) to keep it centered
        const gravityStrength = i === 0 ? 0.05 : 0.005;
        
        vx += dx * gravityStrength;
        vy += dy * gravityStrength;

        // 2. Repulsion (Collision)
        prevBubbles.forEach((other, j) => {
          if (i === j) return;
          const odx = x - other.x;
          const ody = y - other.y;
          const dist = Math.sqrt(odx * odx + ody * ody);
          const minDist = r + other.r + 5; // 5px padding

          if (dist < minDist) {
            const force = (minDist - dist) / minDist; // Normalized force
            const repulsionX = (odx / dist) * force * 2;
            const repulsionY = (ody / dist) * force * 2;
            
            vx += repulsionX;
            vy += repulsionY;
          }
        });

        // 3. Friction / Damping
        vx *= 0.94;
        vy *= 0.94;

        // 4. Update Position
        x += vx;
        y += vy;

        // 5. Boundary Constraints
        if (x < r) { x = r; vx *= -1; }
        if (x > width - r) { x = width - r; vx *= -1; }
        if (y < r) { y = r; vy *= -1; }
        if (y > height - r) { y = height - r; vy *= -1; }

        return { ...b, x, y, vx, vy, r };
      });
    });

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleClick = (bubble: Bubble) => {
      // Check if it was a drag operation
      if (isDragging.current) {
          isDragging.current = false; // Reset for next interaction
          return;
      }
      
      if (bubble.isContract) return; 
      navigate(`/profile/${bubble.isYou ? '' : bubble.address}`);
  };

  return (
    <div ref={containerRef} className="w-full h-[400px] relative overflow-hidden bg-[#050505] rounded-3xl border border-white/5 shadow-inner cursor-grab active:cursor-grabbing">
       {/* Background Grid */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

       {bubbles.map((b, i) => (
         <div
           key={b.address}
           onMouseDown={(e) => handleMouseDown(e, i)}
           onClick={() => handleClick(b)}
           className={`absolute rounded-full flex flex-col items-center justify-center text-center shadow-xl border border-white/10 hover:z-50 hover:scale-110 transition-transform duration-200 group backdrop-blur-sm ${b.isContract ? 'cursor-default' : 'cursor-pointer'}`}
           style={{
             left: b.x,
             top: b.y,
             width: b.r * 2,
             height: b.r * 2,
             backgroundColor: `${b.color}40`, // 25% opacity hex
             borderColor: b.color,
             transform: 'translate(-50%, -50%)',
             boxShadow: `0 0 ${b.r}px ${b.color}20`
           }}
           title={`${b.address}: ${b.percentage.toFixed(2)}%`}
         >
            {b.isContract && <Crown size={Math.max(12, b.r / 2)} className="text-white mb-1 drop-shadow-md" />}
            {b.isYou && <User size={Math.max(12, b.r / 2)} className="text-white mb-1 drop-shadow-md" />}
            
            <span className="font-bold text-white drop-shadow-md leading-none" style={{ fontSize: Math.max(10, b.r / 3) }}>
               {b.percentage.toFixed(1)}%
            </span>
            {b.r > 30 && (
               <span className="text-[9px] text-white/80 font-mono mt-0.5 truncate max-w-[80%]">
                 {b.isContract ? 'Curve' : b.isYou ? 'You' : b.address.slice(0, 6)}
               </span>
            )}

            {/* Hover Detail */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
               {b.address}
            </div>
         </div>
       ))}
    </div>
  );
};

// Memoize with custom comparison for performance optimization
export const BubbleMap = React.memo(BubbleMapComponent, (prevProps, nextProps) => {
  return prevProps.holders.length === nextProps.holders.length &&
    prevProps.holders.every((holder, i) =>
      holder.address === nextProps.holders[i]?.address &&
      holder.percentage === nextProps.holders[i]?.percentage
    );
});

BubbleMap.displayName = 'BubbleMap';
