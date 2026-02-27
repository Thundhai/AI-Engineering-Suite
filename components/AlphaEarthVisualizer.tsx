
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Visualization } from '../types';

interface AlphaEarthVisualizerProps {
  visualizations: Visualization[];
}

const AlphaEarthVisualizer: React.FC<AlphaEarthVisualizerProps> = ({ visualizations }) => {
  if (!visualizations || visualizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600 italic p-8 border border-dashed border-eng-border/30 rounded m-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em]">Awaiting Geospatial Telemetry</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
      {visualizations.map((viz, index) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          key={index} 
          className="eng-panel flex flex-col h-[500px]"
        >
          <div className="eng-header flex justify-between items-center">
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-eng-accent rounded-full animate-pulse"></span>
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">
                   {viz.title}
                </h3>
             </div>
             <span className="text-[9px] font-mono text-slate-500 uppercase">{viz.type}</span>
          </div>
          
          <div className="p-4 flex flex-col h-full">
            <p className="text-[10px] text-slate-400 mb-4 font-sans leading-relaxed line-clamp-2" title={viz.description}>
              {viz.description}
            </p>
            
            <div className="flex-grow w-full relative bg-slate-950 border border-eng-border/30 rounded overflow-hidden shadow-inner group">
              <div className="absolute inset-0 eng-grid-bg opacity-10 pointer-events-none"></div>
              <VisualizationChart viz={viz} />
            </div>
            
            <div className="mt-3 flex justify-between text-[8px] text-slate-600 font-mono uppercase tracking-widest px-1">
               <span>Coord_Min: 0.00</span>
               <span>Geospatial Projection Grid</span>
               <span>Coord_Max: 100.00</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const VisualizationChart: React.FC<{ viz: Visualization }> = ({ viz }) => {
    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: React.ReactNode } | null>(null);

    const getHeatmapColor = (value: number) => {
        const hue = (1 - Math.max(0, Math.min(1, value))) * 240; 
        return `hsl(${hue}, 85%, 55%)`;
    };

    if (viz.type === 'heatmap' && viz.data_points) {
        return (
            <div className="w-full h-full relative" onMouseLeave={() => setTooltip(null)}>
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <filter id="heatmapBlur" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                        </filter>
                    </defs>
                    
                    <g filter="url(#heatmapBlur)" opacity="0.6">
                         {viz.data_points.map((point, i) => (
                            <circle
                                key={`blur-${i}`}
                                cx={point.x}
                                cy={100 - point.y}
                                r={10}
                                fill={getHeatmapColor(point.value)}
                            />
                        ))}
                    </g>

                    {viz.data_points.map((point, i) => (
                        <motion.circle
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                            key={`pt-${i}`}
                            cx={point.x}
                            cy={100 - point.y}
                            r={1.5}
                            fill={getHeatmapColor(point.value)}
                            stroke="rgba(255,255,255,0.8)"
                            strokeWidth="0.2"
                            className="transition-all duration-200 cursor-crosshair hover:r-3 hover:stroke-white"
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltip({
                                    x: rect.left + rect.width / 2, 
                                    y: rect.top,
                                    content: (
                                        <div className="font-mono text-[10px]">
                                            <div className="font-bold text-eng-accent mb-1 uppercase tracking-widest">Telemetry Point</div>
                                            <div className="flex justify-between gap-4"><span className="text-slate-500">Intensity:</span> <span>{(point.value * 100).toFixed(0)}%</span></div>
                                            <div className="flex justify-between gap-4"><span className="text-slate-500">Position:</span> <span>{point.x.toFixed(2)}, {point.y.toFixed(2)}</span></div>
                                            {point.label && <div className="text-yellow-400 mt-1 border-t border-slate-700 pt-1">{point.label}</div>}
                                        </div>
                                    )
                                });
                            }}
                        />
                    ))}
                </svg>

                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur px-3 py-2 rounded border border-eng-border shadow-lg flex flex-col items-center gap-1">
                     <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-green-500 to-red-500"></div>
                     <div className="flex justify-between w-full text-[8px] text-slate-500 uppercase font-bold tracking-widest">
                        <span>Min</span>
                        <span>Max</span>
                     </div>
                </div>

                {tooltip && <Tooltip {...tooltip} />}
            </div>
        );
    }

    if (viz.type === 'contour' && viz.contours) {
         return (
             <div className="w-full h-full relative" onMouseLeave={() => setTooltip(null)}>
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                    {viz.contours.map((line, i) => (
                        <motion.path
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            key={i}
                            d={line.path}
                            fill="none"
                            stroke={line.color || '#22d3ee'}
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-300 hover:stroke-[1.5px] hover:stroke-white cursor-pointer"
                            onMouseEnter={(e) => {
                                 setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    content: (
                                        <div className="font-mono text-[10px]">
                                            <div className="font-bold text-eng-accent border-b border-slate-700 mb-1 pb-1 uppercase tracking-widest">Contour Gradient</div>
                                            <div className="flex justify-between gap-4"><span className="text-slate-500">Elevation:</span> <span className="text-white">{line.value}</span></div>
                                        </div>
                                    )
                                });
                            }}
                        />
                    ))}
                </svg>
                 {tooltip && <Tooltip {...tooltip} />}
            </div>
         );
    }

    return <div className="flex items-center justify-center h-full text-[10px] font-mono text-slate-600 uppercase tracking-widest">Null Data Buffer</div>;
};

const Tooltip: React.FC<{ x: number, y: number, content: React.ReactNode }> = ({ x, y, content }) => {
    return (
        <div 
            className="fixed z-50 bg-slate-900/95 backdrop-blur border border-eng-accent/30 p-3 rounded shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-[120%] transition-opacity duration-200"
            style={{ left: x, top: y }}
        >
            {content}
            <div className="absolute left-1/2 bottom-[-4px] w-2 h-2 bg-slate-900 border-r border-b border-eng-accent/30 transform -translate-x-1/2 rotate-45"></div>
        </div>
    );
};

export default AlphaEarthVisualizer;
