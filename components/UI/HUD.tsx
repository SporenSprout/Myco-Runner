

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MapPin, Rocket, ArrowUpCircle, Shield, Activity, PlusCircle, Play, Share2, Magnet } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, WORD_COLORS, ShopItem, RUN_SPEED_BASE, TARGET_WORD } from '../../types';
import { audio } from '../System/Audio';

const LOGO_URL = "https://raw.githubusercontent.com/SporenSprout/Myco-Runner/main/35495E8D-93A1-4E69-930C-97F7279C64B4.PNG";

// Custom Mushroom Icon (SVG) to ensure availability
const MushroomIcon = ({ className, strokeWidth = 2, ...props }: any) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className} 
        {...props}
    >
        <path d="M10 13v6.6a2 2 0 0 0 2 2h.8a2 2 0 0 0 2-2V13" />
        <path d="M12.4 3.4a6 6 0 0 1 5.6 6.6C17.6 12.2 15 13 12 13s-5.6-.8-6-3a6 6 0 0 1 5.6-6.6Z" />
    </svg>
);

// Donate Button Component
const DonateButton: React.FC = () => (
    <a 
        href="https://www.paypal.com/ncp/payment/78P8LSAHNK7WN" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-6 group relative px-8 py-2 bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-500/60 text-pink-100 font-bold text-sm md:text-base rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] flex items-center justify-center backdrop-blur-sm"
    >
        <span className="relative z-10 drop-shadow-[0_0_5px_rgba(236,72,153,1)]">Donate ❤️</span>
        <div className="absolute inset-0 rounded-full bg-pink-500/10 blur-md animate-pulse"></div>
    </a>
);

// Available Shop Items
const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'DOUBLE_JUMP',
        name: 'DOUBLE JUMP',
        description: 'Jump again in mid-air. Essential for high obstacles.',
        cost: 1000,
        icon: ArrowUpCircle,
        oneTime: true
    },
    {
        id: 'MYCELIAL_LINK',
        name: 'MYCELIAL LINK',
        description: 'Consumable (1 Level): Spores share value. Stacks.',
        cost: 1000,
        icon: Share2,
        oneTime: false // Changed to consumable/stackable
    },
    {
        id: 'MAGNETIC_FIELD',
        name: 'SPORE MAGNET',
        description: '20s Active Field: Automatically attracts spores from adjacent lanes.',
        cost: 1000, // Reduced from 2000
        icon: Magnet,
        oneTime: false // Renewable
    },
    {
        id: 'MAX_LIFE',
        name: 'MAX LIFE UP',
        description: 'Permanently adds a heart slot and heals you.',
        cost: 1500,
        icon: Activity
    },
    {
        id: 'HEAL',
        name: 'REPAIR KIT',
        description: 'Restores 1 Life point instantly.',
        cost: 1000,
        icon: PlusCircle
    },
    {
        id: 'IMMORTAL',
        name: 'IMMORTALITY',
        description: 'Unlock Ability: Press Space/Tap to be invincible for 5s.',
        cost: 3000,
        icon: Shield,
        oneTime: true
    }
];

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop, hasDoubleJump, hasImmortality, mycelialLinkCount, magnetEndTime } = useStore();
    const [items, setItems] = useState<ShopItem[]>([]);
    
    // Check if magnet is currently active
    const hasMagneticField = magnetEndTime > Date.now();

    useEffect(() => {
        // 1. Filter items based on what has already been purchased (for one-time items) or is active
        const validItems = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            // Magnetic Field is valid only if NOT currently active
            if (item.id === 'MAGNETIC_FIELD' && hasMagneticField) return false;
            return true;
        });

        // 2. Show ALL valid items (Removed random slicing logic)
        setItems(validItems);
    }, [hasDoubleJump, hasImmortality, hasMagneticField]);

    return (
        <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
             <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                 <h2 className="text-3xl md:text-4xl font-black text-cyan-400 mb-2 font-cyber tracking-widest text-center">SPORE STORE</h2>
                 <div className="flex items-center text-yellow-400 mb-6 md:mb-8">
                     <span className="text-base md:text-lg mr-2">AVAILABLE SPORES:</span>
                     <span className="text-xl md:text-2xl font-bold">{score.toLocaleString()}</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full mb-8">
                     {items.map(item => {
                         const Icon = item.icon;
                         const canAfford = score >= item.cost;
                         
                         // Check if item is already owned (Standard check, though filtered mostly above)
                         let isOwned = false;
                         if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) isOwned = true;
                         if (item.id === 'IMMORTAL' && hasImmortality) isOwned = true;
                         if (item.id === 'MAGNETIC_FIELD' && hasMagneticField) isOwned = true;
                         
                         return (
                             <div key={item.id} className="bg-gray-900/80 border border-gray-700 p-4 md:p-6 rounded-xl flex flex-col items-center text-center hover:border-cyan-500 transition-colors">
                                 <div className="bg-gray-800 p-3 md:p-4 rounded-full mb-3 md:mb-4 relative">
                                     <Icon className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
                                     {item.id === 'MYCELIAL_LINK' && mycelialLinkCount > 0 && (
                                         <div className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                             {mycelialLinkCount}
                                         </div>
                                     )}
                                 </div>
                                 <h3 className="text-lg md:text-xl font-bold mb-2">{item.name}</h3>
                                 <p className="text-gray-400 text-xs md:text-sm mb-4 h-10 md:h-12 flex items-center justify-center">{item.description}</p>
                                 <button 
                                    onClick={() => !isOwned && buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford || isOwned}
                                    className={`px-4 md:px-6 py-2 rounded font-bold w-full text-sm md:text-base 
                                        ${isOwned 
                                            ? 'bg-green-700 cursor-default' 
                                            : canAfford 
                                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110' 
                                                : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
                                 >
                                     {isOwned ? 'ACTIVE' : `${item.cost} SPORES`}
                                 </button>
                             </div>
                         );
                     })}
                 </div>

                 <button 
                    onClick={closeShop}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,255,0.4)]"
                 >
                     RESUME MISSION <Play className="ml-2 w-5 h-5" fill="white" />
                 </button>
             </div>
        </div>
    );
};

export const HUD: React.FC = () => {
  const { score, lives, maxLives, collectedLetters, status, level, restartGame, startGame, gemsCollected, distance, isImmortalityActive, speed, magnetEndTime, mycelialLinkCount } = useStore();
  
  // Force re-render for timer updates
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
      const interval = setInterval(() => {
          setCurrentTime(Date.now());
      }, 500); // Update every half second for blink/timer logic
      return () => clearInterval(interval);
  }, []);

  const hasMagneticField = magnetEndTime > currentTime;
  const magnetTimeRemaining = Math.max(0, Math.ceil((magnetEndTime - currentTime) / 1000));
  const isMagnetBlinking = hasMagneticField && magnetTimeRemaining <= 5;

  // Common container style
  const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50";

  if (status === GameStatus.SHOP) {
      return <ShopScreen />;
  }

  if (status === GameStatus.MENU) {
      return (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
              {/* Card Container */}
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)] border border-white/10 animate-in zoom-in-95 duration-500">
                
                {/* Custom Myco Runner Visual */}
                {/* Reduced top padding here to move logo higher */}
                <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-indigo-950 via-purple-950 to-black flex flex-col items-center justify-start pt-4 md:pt-8 overflow-hidden">
                    {/* Ambient Glows */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] animate-pulse delay-1000"></div>
                    
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(0,255,255,0.1)_100%),linear-gradient(90deg,transparent_95%,rgba(0,255,255,0.1)_100%)] bg-[length:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom opacity-40 pointer-events-none"></div>

                    {/* Main Visual - Image Logo */}
                    {/* Removed vertical padding to pull logo up */}
                    <div className="relative z-10 flex flex-col items-center px-6 w-full">
                        <img 
                            src={LOGO_URL} 
                            alt="Myco Runner" 
                            className="w-full max-w-[260px] md:max-w-[300px] object-contain drop-shadow-[0_0_25px_rgba(0,255,255,0.6)] animate-pulse" 
                        />
                        {/* Added Maker Text */}
                        <p className="text-cyan-300/60 text-[10px] md:text-xs font-mono mt-2 tracking-[0.2em] uppercase drop-shadow-[0_0_2px_rgba(0,255,255,0.5)]">
                            Made by Spore n' Sprout
                        </p>
                    </div>
                    
                    {/* Start Button Area */}
                    <div className="absolute bottom-0 inset-x-0 p-6 pb-8 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-24 flex flex-col items-center">
                        <button 
                          onClick={() => { audio.init(); startGame(); }}
                          className="w-full group relative px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-black text-xl rounded-xl hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:border-cyan-400/50 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative z-10 tracking-widest flex items-center justify-center font-cyber">
                                INITIALIZE RUN <Play className="ml-3 w-5 h-5 fill-white" />
                            </span>
                        </button>

                        <p className="text-cyan-400/40 text-[10px] md:text-xs font-mono mt-4 tracking-widest text-center mb-2">
                            [ ARROWS / SWIPE TO MOVE ]
                        </p>

                        <DonateButton />
                    </div>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.GAME_OVER) {
      return (
          <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-sm overflow-y-auto">
              <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <img 
                    src={LOGO_URL} 
                    alt="Myco Runner" 
                    className="w-40 md:w-52 object-contain mb-6 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]" 
                />
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] font-cyber text-center">GAME OVER</h1>
                
                <div className="grid grid-cols-1 gap-3 md:gap-4 text-center mb-8 w-full max-w-md">
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-yellow-400 text-sm md:text-base"><Trophy className="mr-2 w-4 h-4 md:w-5 md:h-5"/> LEVEL</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{level} / 10</div>
                    </div>
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-cyan-400 text-sm md:text-base"><MushroomIcon className="mr-2 w-4 h-4 md:w-5 md:h-5"/> SPORES COLLECTED</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{gemsCollected}</div>
                    </div>
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-purple-400 text-sm md:text-base"><MapPin className="mr-2 w-4 h-4 md:w-5 md:h-5"/> DISTANCE</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{Math.floor(distance)} LY</div>
                    </div>
                     <div className="bg-gray-800/50 p-3 md:p-4 rounded-lg flex items-center justify-between mt-2">
                        <div className="flex items-center text-white text-sm md:text-base">TOTAL SCORE</div>
                        <div className="text-2xl md:text-3xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{score.toLocaleString()}</div>
                    </div>
                </div>

                <button 
                  onClick={() => { audio.init(); restartGame(); }}
                  className="px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                >
                    RUN AGAIN
                </button>

                <DonateButton />
              </div>
          </div>
      );
  }

  if (status === GameStatus.VICTORY) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/90 to-black/95 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <img 
                    src={LOGO_URL} 
                    alt="Myco Runner" 
                    className="w-40 md:w-52 object-contain mb-8 drop-shadow-[0_0_25px_rgba(255,215,0,0.6)] animate-pulse" 
                />
                {/* Updated Icon to Mushroom */}
                <MushroomIcon 
                    className="w-16 h-16 md:w-24 md:h-24 text-yellow-400 mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" 
                    strokeWidth={1.5}
                />
                <h1 className="text-3xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-pink-500 mb-2 drop-shadow-[0_0_20px_rgba(255,165,0,0.6)] font-cyber text-center leading-tight">
                    MISSION COMPLETE
                </h1>
                <p className="text-cyan-300 text-sm md:text-2xl font-mono mb-8 tracking-widest text-center">
                    THE MYCELIUM NETWORK IS COMPLETE
                </p>
                
                <div className="grid grid-cols-1 gap-4 text-center mb-8 w-full max-w-md">
                    <div className="bg-black/60 p-6 rounded-xl border border-yellow-500/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                        <div className="text-xs md:text-sm text-gray-400 mb-1 tracking-wider">FINAL SCORE</div>
                        <div className="text-3xl md:text-4xl font-bold font-cyber text-yellow-400">{score.toLocaleString()}</div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/60 p-4 rounded-lg border border-white/10">
                            <div className="text-xs text-gray-400">SPORES</div>
                            <div className="text-xl md:text-2xl font-bold text-cyan-400">{gemsCollected}</div>
                        </div>
                        <div className="bg-black/60 p-4 rounded-lg border border-white/10">
                             <div className="text-xs text-gray-400">DISTANCE</div>
                            <div className="text-xl md:text-2xl font-bold text-purple-400">{Math.floor(distance)} LY</div>
                        </div>
                     </div>
                </div>

                <button 
                  onClick={() => { audio.init(); restartGame(); }}
                  className="px-8 md:px-12 py-4 md:py-5 bg-white text-black font-black text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] tracking-widest"
                >
                    RESTART MISSION
                </button>

                <DonateButton />
            </div>
        </div>
    );
  }

  return (
    <div className={containerClass}>
        {/* Top Bar */}
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
                <div className="text-3xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_10px_#00ffff] font-cyber">
                    {score.toLocaleString()}
                </div>
            </div>
            
            <div className="flex space-x-1 md:space-x-2">
                {[...Array(maxLives)].map((_, i) => (
                    <Heart 
                        key={i} 
                        className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-pink-500 fill-pink-500' : 'text-gray-800 fill-gray-800'} drop-shadow-[0_0_5px_#ff0054]`} 
                    />
                ))}
            </div>
        </div>
        
        {/* Level Indicator - Moved to Top Center aligned with Score/Hearts */}
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-sm md:text-lg text-purple-300 font-bold tracking-wider font-mono bg-black/50 px-3 py-1 rounded-full border border-purple-500/30 backdrop-blur-sm z-50">
            LEVEL {level} <span className="text-gray-500 text-xs md:text-sm">/ 10</span>
        </div>

        {/* Word Collection Status */}
        <div className="absolute top-16 md:top-24 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {TARGET_WORD.map((char, idx) => {
                const isCollected = collectedLetters.includes(idx);
                const color = WORD_COLORS[idx];

                return (
                    <div 
                        key={idx}
                        style={{
                            borderColor: isCollected ? color : 'rgba(55, 65, 81, 1)',
                            color: isCollected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(55, 65, 81, 1)',
                            boxShadow: isCollected ? `0 0 20px ${color}` : 'none',
                            backgroundColor: isCollected ? color : 'rgba(0, 0, 0, 0.9)'
                        }}
                        className={`w-6 h-8 md:w-8 md:h-10 lg:w-10 lg:h-12 flex items-center justify-center border md:border-2 font-black text-sm md:text-lg lg:text-xl font-cyber rounded transform transition-all duration-300`}
                    >
                        {char}
                    </div>
                );
            })}
        </div>

        {/* Bottom Left Active Upgrades */}
        <div className="absolute bottom-16 left-4 md:bottom-8 md:left-8 flex flex-col space-y-2 items-start z-50">
            {isImmortalityActive && (
                 <div className="bg-black/60 border border-yellow-500/50 text-yellow-400 font-bold text-sm md:text-base px-3 py-1 rounded flex items-center drop-shadow-[0_0_10px_gold] animate-pulse">
                     <Shield className="mr-2 w-4 h-4 fill-yellow-400" /> IMMORTAL
                 </div>
            )}
            {hasMagneticField && (
                <div className={`bg-black/60 border border-cyan-500/50 text-cyan-400 font-bold text-sm md:text-base px-3 py-1 rounded flex items-center drop-shadow-[0_0_5px_cyan] ${isMagnetBlinking ? 'text-red-400 border-red-400 animate-pulse' : ''}`}>
                    <Magnet className="mr-2 w-4 h-4" /> {magnetTimeRemaining}s
                </div>
            )}
            {mycelialLinkCount > 0 && (
                <div className="bg-black/60 border border-green-500/50 text-green-400 font-bold text-sm md:text-base px-3 py-1 rounded flex items-center drop-shadow-[0_0_5px_lime]">
                     <Share2 className="mr-2 w-4 h-4" /> {mycelialLinkCount} LINKED
                </div>
            )}
        </div>

        {/* Bottom Overlay Right (Speed) */}
        <div className="w-full flex justify-end items-end">
             <div className="flex items-center space-x-2 text-cyan-500 opacity-70">
                 <Zap className="w-4 h-4 md:w-6 md:h-6 animate-pulse" />
                 <span className="font-mono text-base md:text-xl">SPEED {Math.round((speed / RUN_SPEED_BASE) * 100)}%</span>
             </div>
        </div>
    </div>
  );
};