
import React from 'react';
import { GearIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-cyan-500/20">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <GearIcon className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-wider">AI Engineering Suite</h1>
          <p className="text-xs text-gray-400">Multidisciplinary Expert System with Automated Agents</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
