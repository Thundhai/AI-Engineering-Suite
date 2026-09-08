import React, { useState } from 'react';
import { Visualization } from '../types';

interface AlphaEarthVisualizerProps {
  visualizations: Visualization[];
}

const AlphaEarthVisualizer: React.FC<AlphaEarthVisualizerProps> = ({ visualizations }) => {
  if (!visualizations || visualizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-eng-muted p-8 border border-dashed border-eng-border rounded-md m-4">
        <p className="text-sm">No geospatial data for this report</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
      {visualizations.map((viz, index) => (
        <div key={index} className="eng-panel flex flex-col h-[500px]">
          <div className="eng-header flex justify-between items-center">
             <h3 className="text-sm font-medium text-eng-navy">
                {viz.title}
             </h3>
             <span className="text-xs text-eng-muted uppercase">{viz.type}</span>
          </div>

          <div className="p-4 flex flex-col h-full">
            <p className="text-xs text-eng-muted mb-4 leading-relaxed line-clamp-2" title={viz.description}>
              {viz.description}
            </p>

            <div className="flex-grow w-full relative bg-slate-50 border border-eng-border rounded-md overflow-hidden shadow-inner">
              <VisualizationChart viz={viz} />
            </div>

            <div className="mt-3 flex justify-between text-xs text-eng-muted px-1">
               <span>Min: 0.00</span>
               <span>Coordinate grid</span>
               <span>Max: 100.00</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const VisualizationChart: React.FC<{ viz: Visualization }> = ({ viz }) => {
    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: React.ReactNode } | null>(null);

    const getHeatmapColor = (value: number) => {
        const hue = (1 - Math.max(0, Math.min(1, value))) * 220;
        return `hsl(${hue}, 70%, 50%)`;
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

                    <g filter="url(#heatmapBlur)" opacity="0.5">
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
                        <circle
                            key={`pt-${i}`}
                            cx={point.x}
                            cy={100 - point.y}
                            r={1.5}
                            fill={getHeatmapColor(point.value)}
                            stroke="rgba(255,255,255,0.9)"
                            strokeWidth="0.2"
                            className="cursor-crosshair"
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltip({
                                    x: rect.left + rect.width / 2,
                                    y: rect.top,
                                    content: (
                                        <div className="text-xs">
                                            <div className="font-medium text-eng-navy mb-1">Data point</div>
                                            <div className="flex justify-between gap-4"><span className="text-eng-muted">Intensity:</span> <span>{(point.value * 100).toFixed(0)}%</span></div>
                                            <div className="flex justify-between gap-4"><span className="text-eng-muted">Position:</span> <span>{point.x.toFixed(2)}, {point.y.toFixed(2)}</span></div>
                                            {point.label && <div className="text-eng-warning mt-1 border-t border-eng-border pt-1">{point.label}</div>}
                                        </div>
                                    )
                                });
                            }}
                        />
                    ))}
                </svg>

                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-md border border-eng-border shadow-sm flex flex-col items-center gap-1">
                     <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500"></div>
                     <div className="flex justify-between w-full text-[10px] text-eng-muted font-medium">
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
                        <path
                            key={i}
                            d={line.path}
                            fill="none"
                            stroke={line.color || '#2f6690'}
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="hover:stroke-[1.5px] cursor-pointer transition-all"
                            onMouseEnter={(e) => {
                                 setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    content: (
                                        <div className="text-xs">
                                            <div className="font-medium text-eng-navy border-b border-eng-border mb-1 pb-1">Contour</div>
                                            <div className="flex justify-between gap-4"><span className="text-eng-muted">Elevation:</span> <span className="text-eng-ink">{line.value}</span></div>
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

    return <div className="flex items-center justify-center h-full text-sm text-eng-muted">No data</div>;
};

const Tooltip: React.FC<{ x: number, y: number, content: React.ReactNode }> = ({ x, y, content }) => {
    return (
        <div
            className="fixed z-50 bg-white border border-eng-border p-3 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-[120%]"
            style={{ left: x, top: y }}
        >
            {content}
        </div>
    );
};

export default AlphaEarthVisualizer;
