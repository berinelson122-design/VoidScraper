import React, { useState } from 'react';
import GameRunner from './components/GameRunner';
import { Play } from 'lucide-react';

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center relative overflow-hidden text-[#00f3ff]">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
      
      <header className="mb-6 text-center z-10">
        <h1 className="text-5xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(0,243,255,0.8)] mb-2 italic">
          CYBER<span className="text-[#39ff14]">-NINJA</span> RUN
        </h1>
        <p className="text-sm tracking-widest text-gray-400 uppercase">Endless Runner Protocol</p>
      </header>

      <main className="relative z-10 w-full max-w-4xl p-4">
        {!isPlaying ? (
          <div className="bg-[#1a1a1a] border-2 border-[#39ff14] rounded-xl p-12 flex flex-col items-center text-center shadow-[0_0_30px_rgba(57,255,20,0.3)]">
            <div className="mb-8 space-y-4">
              <h2 className="text-2xl font-bold text-white">Directives</h2>
              <ul className="text-gray-300 space-y-2 text-lg">
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#00f3ff] rounded-full"></span>
                  Press <kbd className="bg-gray-800 px-2 py-1 rounded border border-gray-600">Space</kbd> to Jump
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#00f3ff] rounded-full"></span>
                  Double press for <span className="text-[#00f3ff]">Double Jump</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#ff003c] rounded-full"></span>
                  Avoid <span className="text-[#ff003c]">Red Spikes</span>
                </li>
              </ul>
            </div>
            
            <button 
              onClick={() => setIsPlaying(true)}
              className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.6)]"
            >
              <div className="absolute inset-0 w-full h-full bg-[#00f3ff]/10 group-hover:bg-[#00f3ff]/20 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00f3ff]"></div>
              <div className="absolute top-0 right-0 w-full h-[2px] bg-[#00f3ff]"></div>
              <div className="flex items-center gap-3 relative z-10">
                <Play className="w-6 h-6 fill-[#00f3ff]" />
                <span className="text-xl font-bold tracking-wider">INITIATE RUN</span>
              </div>
            </button>
          </div>
        ) : (
          <GameRunner onExit={() => setIsPlaying(false)} />
        )}
      </main>

      <footer className="absolute bottom-4 text-gray-600 text-xs z-10">
        SYSTEM STATUS: ONLINE // v1.0.0
      </footer>
    </div>
  );
};

export default App;