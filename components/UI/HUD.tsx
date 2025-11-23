/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MapPin, Rocket, ArrowUpCircle, Shield, Activity, PlusCircle, Share2, Magnet } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, WORD_COLORS, ShopItem, RUN_SPEED_BASE, TARGET_WORD } from '../../types';
import { audio } from '../System/Audio';

// Custom Mushroom Icon (SVG)
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
        className="mt-6 group relative px-8 py-2 bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-500/60 text-pink-100 font-bold text-sm md:text-base rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] flex items-center justify-center backdrop-blur-sm pointer-events-auto"
    >
        <span className="relative z-10 drop-shadow-[0_0_5px_rgba(236,72,153,1)]">Donate ❤️</span>
        <div className="absolute inset-0 rounded-full bg-pink-500/10 blur-md animate-pulse"></div>
    </a>
);

// Shop Items
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
        oneTime: false
    },
    {
        id: 'MAGNETIC_FIELD',
        name: 'SPORE MAGNET',
        description: '20s Active Field: Auto-attracts spores from other lanes.',
        cost: 1000,
        icon: Magnet,
        oneTime: false
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
    const hasMagneticField = magnetEndTime > Date.now();

    useEffect(() => {
        const validItems = SHOP_ITEMS.filter(item => {
            if (item.id === "DOUBLE_JUMP" && hasDoubleJump) return false;
            if (item.id === "IMMORTAL" && hasImmortality) return false;
            if (item.id === "MAGNETIC_FIELD" && hasMagneticField) return false;
            return true;
        });

        setItems(validItems);
    }, [hasDoubleJump, hasImmortality, hasMagneticField]);

    return (
        <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-height-screen py-8 px-4">

                <h2 className="text-3xl md:text-4xl font-black text-cyan-400 mb-2 font-cyber tracking-widest text-center">
                    SPORE STORE
                </h2>

                <div className="flex items-center text-yellow-400 mb-6 md:mb-8">
                    <span className="text-base md:text-lg mr-2">AVAILABLE SPORES:</span>
                    <span className="text-xl md:text-2xl font-bold">{score.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full mb-8">
                    {items.map(item => {
                        const Icon = item.icon;
                        const canAfford = score >= item.cost;

                        let isOwned = false;
                        if (item.id === "DOUBLE_JUMP" && hasDoubleJump) isOwned = true;
                        if (item.id === "IMMORTAL" && hasImmortality) isOwned = true;
                        if (item.id === "MAGNETIC_FIELD" && hasMagneticField) isOwned = true;

                        return (
                            <div
                                key={item.id}
                                className="bg-gray-900/80 border border-gray-700 p-4 md:p-6 rounded-xl flex flex-col items-center text-center hover:border-cyan-500 transition-colors"
                            >
                                <div className="bg-gray-800 p-3 md:p-4 rounded-full mb-3 md:mb-4 relative">
                                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
                                    {item.id === "MYCELIAL_LINK" && mycelialLinkCount > 0 && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                            {mycelialLinkCount}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg md:text-xl font-bold mb-2">{item.name}</h3>

                                <p className="text-gray-400 text-xs md:text-sm mb-4 h-10 md:h-12 flex items-center justify-center">
                                    {item.description}
                                </p>

                                <button
                                    onClick={() => !isOwned && buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford || isOwned}
                                    className={`px-4 md:px-6 py-2 rounded font-bold w-full text-sm md:text-base pointer-events-auto
                                        ${
                                            isOwned
                                                ? "bg-green-700 cursor-default"
                                                : canAfford
                                                ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110"
                                                : "bg-gray-700 cursor-not-allowed opacity-50"
                                        }`}
                                >
                                    {isOwned ? "ACTIVE" : `${item.cost} SPORES`}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => { audio.init(); closeShop(); }}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,255,0.4)] pointer-events-auto"
                >
                    RESUME MISSION <Play className="ml-2 w-5 h-5" fill="white" />
                </button>

                <DonateButton />
            </div>
        </div>
    );
};

// ---------- MAIN HUD ----------

export const HUD: React.FC = () => {
  const { 
    score, 
    lives, 
    maxLives, 
    collectedLetters, 
    status, 
    level, 
    restartGame, 
    startGame, 
    gemsCollected, 
    distance, 
    isImmortalityActive, 
    speed, 
    magnetEndTime,
    mycelialLinkCount
  } = useStore();

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(Date.now()), 500);
      return () => clearInterval(interval);
  }, []);

  const hasMagneticField = magnetEndTime > currentTime;
  const magnetTimeRemaining = Math.max(0, Math.ceil((magnetEndTime - currentTime) / 1000));
  const isMagnetBlinking = hasMagneticField && magnetTimeRemaining <= 5;

  // SAFE AREA + NON-BLOCKING WRAPPER
  const containerClass =
    "absolute inset-0 z-[9999] flex flex-col justify-between p-4 md:p-8 pointer-events-none";
  const safeArea: React.CSSProperties = {
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };

  // SHOP MODE
  if (status === GameStatus.SHOP) {
    return <ShopScreen />;
  }

  // MENU MODE
  if (status === GameStatus.MENU) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-sm p​-4 pointer-events-auto">
        <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)] border border-white/10">
          <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-indigo-950 via-purple-950 to-black flex flex-col items-center justify-start pt-6 md:pt-8 overflow-hidden">

            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] animate-pulse delay-1000"></div>

            <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(0,255,255,0.1)_100%),linear-gradient(90deg,transparent_95%,rgba(0,255,255,0.1)_100%)] bg-[length:40px_40px] [transform:perspective(500px)_rotateX(60deg)] opacity-40 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center px-6 w-full mt-2">
              <MushroomIcon className="w-20 h-20 md:w-24 md:h-24 text-cyan-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]" strokeWidth={1.5} />

              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 drop-shadow-[0_0_20px_rgba(0,255,255,0.4)] font-cyber text-center">
                MYCO<br />RUNNER
              </h1>

              <p className="text-cyan-300/60 text-[10px] md:text-xs font-mono mt-2 tracking-[0.2em] uppercase">
                Made by Spore n' Sprout
              </p>
            </div>

            {/* Start Button */}
            <div className="absolute bottom-0 inset-x-0 p-6 pb-8 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-24 flex flex-col items-center">
              <button
                onClick={() => { audio.init(); startGame(); }}
                className="w-full group relative px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-black text-lg md:text-xl rounded-xl hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] pointer-events-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10 tracking-widest">INITIALIZE RUN</span>
              </button>

              <p className="text-cyan-400/40 text-[10px] md:text-xs font-mono mt-4 tracking-widest">
                [ ARROWS / SWIPE TO MOVE ]
              </p>

              <DonateButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GAME OVER
  if (status === GameStatus.GAME_OVER) {
    return (
      <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-sm overflow-y-auto">
        <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
          <MushroomIcon className="w-20 h-20 md:w-24 md:h-24 text-cyan-400 mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]" strokeWidth={1.5} />

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_0_10px_rgba(255,0,255,0.8)] font-cyber text-center">
            GAME OVER
          </h1>

          <div className="grid grid-cols-1 gap-3 md:gap-4 text-center mb-8 w-full max-w-md">
            <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
              <div className="text-sm md:text-base text-yellow-400 flex items-center"><Trophy className="mr-2 w-4 h-4" /> LEVEL</div>
              <div className="text-xl md:text-3xl font-bold font-cyber">{level} / 10</div>
            </div>

            <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
              <div className="text-sm md:text-base text-cyan-400 flex items-center">
                <MushroomIcon className="mr-2 w-4 h-4" /> SPORES
              </div>
              <div className="text-xl md:text-3xl font-bold font-cyber">
                {gemsCollected}
              </div>
            </div>

            <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
              <div className="text-sm md:text-base text-purple-400 flex items-center">
                <MapPin className="mr-2 w-4 h-4" /> DISTANCE
              </div>
              <div className="text-xl md:text-3xl font-bold font-cyber">
                {Math.floor(distance)} LY
              </div>
            </div>
          </div>

          <button
            onClick={() => { audio.init(); restartGame(); }}
            className="px-8 md:px-12 py-4 md:py-5 bg-white text-black font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] pointer-events-auto"
          >
            RESTART MISSION
          </button>

          <DonateButton />
        </div>
      </div>
    );
  }

  // ---------- IN-GAME HUD ----------
  return (
    <div className={containerClass} style={safeArea}>

      {/* TOP ROW */}
      <div className="flex justify-between items-start w-full">

        {/* SCORE */}
        <div className="flex flex-col">
          <div className="text-3xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_10px_#00ffff] font-cyber">
            {score.toLocaleString()}
          </div>
        </div>

        {/* HEARTS */}
        <div className="flex space-x-1 md:space-x-2">
          {[...Array(maxLives)].map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 md:w-8 md:h-8 ${
                i < lives ? "text-pink-500 fill-pink-500" : "text-gray-800 fill-gray-800"
              } drop-shadow-[0_0_5px_#ff0054]`}
            />
          ))}
        </div>
      </div>

      {/* LEVEL INDICATOR */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-sm md:text-lg text-purple-300 font-bold tracking-wider font-cyber bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm z-50">
        LEVEL {level} <span className="text-gray-500 text-xs md:text-sm">/ 10</span>
      </div>

      {/* WORD COLLECTION */}
      <div className="absolute top-16 md:top-24 left-1/2 -translate-x-1/2 flex space-x-1">
        {TARGET_WORD.map((char, i) => {
          const isCollected = collectedLetters.includes(i);
          const color = WORD_COLORS[i];

          return (
            <div
              key={i}
              style={{
                borderColor: isCollected ? color : "rgba(55,65,81,1)",
                color: isCollected ? "rgba(0,0,0,0.8)" : "rgba(55,65,81,1)",
                backgroundColor: isCollected ? color : "rgba(0,0,0,0.9)",
                boxShadow: isCollected ? `0 0 20px ${color}` : "none",
              }}
              className="w-6 h-8 md:w-8 md:h-10 lg:w-10 lg:h-12 flex items-center justify-center 
                         border md:border-2 font-black text-sm md:text-lg lg:text-xl font-cyber 
                         rounded transition-all duration-300"
            >
              {char}
            </div>
          );
        })}
      </div>

      {/* ACTIVE POWERUPS (BOTTOM LEFT) */}
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+4rem)] left-4 md:left-8 flex flex-col space-y-2 items-start z-50">
        {isImmortalityActive && (
          <div className="bg-black/60 border border-yellow-500/50 text-yellow-400 font-bold text-sm md:text-base px-3 py-1 rounded flex items-center drop-shadow-[0_0_10px_gold]">
            <Shield className="mr-2 w-4 h-4" /> IMMORTAL
          </div>
        )}

        {hasMagneticField && (
          <div className={`bg-black/60 border ${isMagnetBlinking ? "border-red-500 text-red-400 animate-pulse" : "border-cyan-500 text-cyan-400"} 
               font-bold text-sm md:text-base px-3 py-1 rounded flex items-center drop-shadow-[0_0_5px_cyan]`}>
            <Magnet className="mr-2 w-4 h-4" /> {magnetTimeRemaining}s
          </div>
        )}

        {mycelialLinkCount > 0 && (
          <div className="bg-black/60 border border-green-500/50 text-green-400 font-bold text-sm md:text-base px-3 py-1 rounded flex items-center drop-shadow-[0_0_5px_lime]">
            <Share2 className="mr-2 w-4 h-4" /> {mycelialLinkCount} LINKED
          </div>
        )}
      </div>

      {/* BOTTOM RIGHT SPEED METER */}
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+4rem)] right-4 md:right-8 flex items-end justify-end">
        <div className="flex items-center space-x-2 text-cyan-500 opacity-70 bg-black/40 px-3 py-2 rounded-lg backdrop-blur-md">
          <Zap className="w-4 h-4 md:w-6 md:h-6 animate-pulse" />
          <span className="font-mono text-base md:text-xl">
            SPEED {Math.round((speed / RUN_SPEED_BASE) * 100)}%
          </span>
        </div>
      </div>

    </div>
  );
};

