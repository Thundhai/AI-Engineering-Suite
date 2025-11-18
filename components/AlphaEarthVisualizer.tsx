
import React, { useState } from 'react';
import { Visualization, VisualizationDataPoint, ContourLine } from '../types';

interface AlphaEarthVisualizerProps {
  visualizations: Visualization[];
}

const AlphaEarthVisualizer: React.FC<AlphaEarthVisualizerProps> = ({ visualizations }) => {
  if (!visualizations || visualizations.length === 0) {
    return <div className="text-gray-400 italic">No geospatial visualization data available for this report.</div>;
  }

  return (
    <div className="space-y-8">
      {visualizations.map((viz, index) => (
        <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold text-cyan-400 mb-2">{viz.title}</h3>
          <p className="text-sm text-gray-300 mb-4">{viz.description}</p>
          
          <div className="relative w-full aspect-square max-w-md mx-auto bg-gray-900 border border-gray-600 rounded-md overflow-hidden">
            <VisualizationChart viz={viz} />
          </div>
          
          <div className="mt-2 flex justify-between text-xs text-gray-400 px-2 max-w-md mx-auto">
             <span>{viz.x_label || 'Longitude / X-Axis'}</span>
             <span>{viz.y_label || 'Latitude / Y-Axis'}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const VisualizationChart: React.FC<{ viz: Visualization }> = ({ viz }) => {
    const [hoveredPoint, setHoveredPoint] = useState<VisualizationDataPoint | null>(null);
    const [hoveredLine, setHoveredLine] = useState<ContourLine | null>(null);

    if (viz.type === 'heatmap' && viz.data_points) {
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Grid background */}
                <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />

                {viz.data_points.map((point, i) => (
                    <circle
                        key={i}
                        cx={point.x}
                        cy={100 - point.y} // Invert Y for SVG coords
                        r={3 + point.value * 4}
                        fill={`rgba(${255 * point.value}, ${255 * (1 - point.value)}, 50, 0.7)`}
                        stroke="white"
                        strokeWidth="0.2"
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="transition-all duration-300 hover:opacity-100 cursor-crosshair"
                    />
                ))}
                
                {hoveredPoint && (
                    <g>
                        <rect 
                            x="2" y="2" width="45" height="15" rx="2" 
                            fill="rgba(0,0,0,0.8)" stroke="cyan" strokeWidth="0.5" 
                        />
                        <text x="5" y="12" fontSize="4" fill="white">
                            Val: {hoveredPoint.value.toFixed(2)} (x:{hoveredPoint.x}, y:{hoveredPoint.y})
                        </text>
                    </g>
                )}
            </svg>
        );
    }

    if (viz.type === 'contour' && viz.contours) {
         return (
            <svg viewBox="0 0 100 100" className="w-full h-full">
                 <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />

                {viz.contours.map((line, i) => (
                    <path
                        key={i}
                        d={line.path}
                        fill="none"
                        stroke={line.color || 'cyan'}
                        strokeWidth="1"
                        onMouseEnter={() => setHoveredLine(line)}
                        onMouseLeave={() => setHoveredLine(null)}
                        className="hover:stroke-width-2 cursor-pointer transition-all"
                    />
                ))}

                 {hoveredLine && (
                    <g>
                         <rect 
                            x="2" y="2" width="30" height="15" rx="2" 
                            fill="rgba(0,0,0,0.8)" stroke={hoveredLine.color} strokeWidth="0.5" 
                        />
                        <text x="5" y="12" fontSize="4" fill="white">
                            Level: {hoveredLine.value}
                        </text>
                    </g>
                )}
            </svg>
         );
    }

    return <div className="flex items-center justify-center h-full text-xs text-red-400">Unsupported or empty visualization data</div>;
};

export default AlphaEarthVisualizer;
