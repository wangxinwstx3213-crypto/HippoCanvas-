import React from 'react';
import { Position } from '../types';
import { Plug2, X } from 'lucide-react';

interface ConnectionLineProps {
  start: Position;
  end: Position;
  isSelected?: boolean;
  id?: string;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ 
  start, 
  end, 
  isSelected, 
  id, 
  onSelect, 
  onDelete 
}) => {
  // Calculate control points for a wire-like Bezier curve
  const dist = Math.abs(end.x - start.x);
  const controlPoint1 = { x: start.x + dist * 0.5, y: start.y };
  const controlPoint2 = { x: end.x - dist * 0.5, y: end.y };

  const path = `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${end.x} ${end.y}`;

  // Approximate mid-point of the cubic bezier for placing the delete button
  const t = 0.5;
  const mt = 1 - t;
  const midX = mt*mt*mt*start.x + 3*mt*mt*t*controlPoint1.x + 3*mt*t*t*controlPoint2.x + t*t*t*end.x;
  const midY = mt*mt*mt*start.y + 3*mt*mt*t*controlPoint1.y + 3*mt*t*t*controlPoint2.y + t*t*t*end.y;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id && onSelect) {
      onSelect(id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id && onDelete) {
      onDelete(id);
    }
  };

  return (
    <g className="pointer-events-auto group">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
           <stop offset="0%" stopColor="#6366f1" />
           <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
           <stop offset="0%" stopColor="#a5b4fc" />
           <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
      </defs>

      {/* Invisible thick path for easier clicking - using strokeOpacity instead of transparent color for better compatibility */}
      <path
        d={path}
        fill="none"
        stroke="white"
        strokeOpacity={0}
        strokeWidth={24}
        strokeLinecap="round"
        onClick={handleClick}
        className="cursor-pointer"
        style={{ pointerEvents: 'stroke' }}
      />

      {/* Shadow/Outer Glow - Enhanced when selected */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? "#a5b4fc" : "#6366f1"}
        strokeWidth={isSelected ? 8 : 4}
        strokeLinecap="round"
        opacity={isSelected ? 1 : 0.4}
        filter="url(#glow)"
        className="pointer-events-none transition-all duration-300"
      />

      {/* Main Wire Body */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? "url(#selectedGradient)" : "url(#activeGradient)"}
        strokeWidth={isSelected ? 4 : 3}
        strokeLinecap="round"
        className="pointer-events-none transition-all duration-300"
      />

      {/* Animated Flow Dash */}
      <path
        d={path}
        fill="none"
        stroke="white"
        strokeWidth={isSelected ? 2 : 1}
        strokeDasharray="10, 40"
        strokeOpacity={isSelected ? 0.9 : 0.5}
        className="pointer-events-none animate-[flow_2s_linear_infinite]"
      />

      {/* Delete Button (Visible only when selected) */}
      {isSelected && (
        <foreignObject x={midX - 20} y={midY - 20} width={40} height={40} className="overflow-visible">
          <div className="w-full h-full flex items-center justify-center">
             <button 
                className="w-7 h-7 bg-slate-900 border-2 border-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500 hover:text-white text-red-500 shadow-xl transition-all transform hover:scale-110 z-50"
                onClick={handleDelete}
                onMouseDown={(e) => e.stopPropagation()} // Prevent dragging canvas when clicking button
                title="删除连接 (Delete)"
             >
                <X size={16} strokeWidth={3} />
             </button>
          </div>
        </foreignObject>
      )}

      {/* Start Point */}
      <circle cx={start.x} cy={start.y} r={4} fill="#1e293b" stroke="#475569" strokeWidth={2} className="pointer-events-none" />
      
      {/* End Point (Plug Head) */}
      <foreignObject x={end.x - 20} y={end.y - 20} width={40} height={40} className="overflow-visible pointer-events-none">
          <div className={`w-10 h-10 bg-slate-200 border-2 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isSelected ? 'border-white shadow-[0_0_15px_rgba(165,180,252,0.8)] scale-110' : 'border-primary shadow-[0_0_10px_rgba(99,102,241,0.3)]'}`}>
             <Plug2 size={20} className="text-slate-700 rotate-45" />
          </div>
       </foreignObject>

      <style>{`
        @keyframes flow {
          to {
             stroke-dashoffset: -50;
          }
        }
      `}</style>
    </g>
  );
};