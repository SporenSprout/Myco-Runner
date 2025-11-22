
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, TARGET_WORD } from './types';

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[]; 
  level: number;
  laneCount: number;
  gemsCollected: number;
  distance: number;
  
  // Inventory / Abilities
  hasDoubleJump: boolean;
  hasImmortality: boolean;
  isImmortalityActive: boolean;
  mycelialLinkCount: number; // Replaced boolean with count
  magnetEndTime: number; // Timestamp when magnet expires
  
  // System
  invulnerableUntil: number; // Timestamp for temporary invincibility (transitions/start)
  lastDamageTime: number; // Timestamp for hit cooldown/debounce

  // Actions
  startGame: () => void;
  restartGame: () => void;
  takeDamage: () => void;
  addScore: (amount: number) => void;
  collectGem: (value: number) => void;
  collectLetter: (index: number) => void;
  setStatus: (status: GameStatus) => void;
  setDistance: (dist: number) => void;
  
  // Shop / Abilities
  buyItem: (type: 'DOUBLE_JUMP' | 'MAX_LIFE' | 'HEAL' | 'IMMORTAL' | 'MYCELIAL_LINK' | 'MAGNETIC_FIELD', cost: number) => boolean;
  advanceLevel: () => void;
  openShop: () => void;
  closeShop: () => void;
  activateImmortality: () => void;
}

const MAX_LEVEL = 10;

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  lives: 3,
  maxLives: 3,
  speed: 0,
  collectedLetters: [],
  level: 1,
  laneCount: 3,
  gemsCollected: 0,
  distance: 0,
  
  hasDoubleJump: false,
  hasImmortality: false,
  isImmortalityActive: false,
  mycelialLinkCount: 0,
  magnetEndTime: 0,
  invulnerableUntil: 0,
  lastDamageTime: 0,

  startGame: () => set({ 
    status: GameStatus.PLAYING, 
    score: 0, 
    lives: 3, 
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    hasDoubleJump: false,
    hasImmortality: false,
    isImmortalityActive: false,
    mycelialLinkCount: 0,
    magnetEndTime: 0,
    // 3-second grace period to cover startup lag/shader compilation
    invulnerableUntil: Date.now() + 3000,
    lastDamageTime: 0
  }),

  restartGame: () => set({ 
    status: GameStatus.PLAYING, 
    score: 0, 
    lives: 3, 
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    hasDoubleJump: false,
    hasImmortality: false,
    isImmortalityActive: false,
    mycelialLinkCount: 0,
    magnetEndTime: 0,
    // 3-second grace period to cover restart lag
    invulnerableUntil: Date.now() + 3000,
    lastDamageTime: 0
  }),

  takeDamage: () => {
    const { lives, isImmortalityActive, invulnerableUntil, lastDamageTime } = get();
    const now = Date.now();

    // 1. Cooldown Check: Prevent multiple hits being registered in < 1 second
    if (now - lastDamageTime < 1000) return;

    // 2. Invulnerability Check: Ignore damage if ability active or in grace period
    if (isImmortalityActive || now < invulnerableUntil) return; 

    // Register valid hit
    set({ magnetEndTime: 0, lastDamageTime: now });

    if (lives > 1) {
      set({ lives: lives - 1 });
    } else {
      set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0 });
    }
  },

  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  
  collectGem: (value) => set((state) => ({ 
    score: state.score + value, 
    gemsCollected: state.gemsCollected + 1 
  })),

  setDistance: (dist) => set({ distance: dist }),

  collectLetter: (index) => {
    const { collectedLetters, level, speed, mycelialLinkCount } = get();
    
    if (!collectedLetters.includes(index)) {
      let newLetters = [...collectedLetters, index];

      // Double Letter Logic (Mycelial Link) - Check if count > 0
      if (mycelialLinkCount > 0) {
          const char = TARGET_WORD[index];
          TARGET_WORD.forEach((c, i) => {
              if (c === char && i !== index && !newLetters.includes(i)) {
                  newLetters.push(i);
              }
          });
      }
      
      // Calculate speed increase based on new total letters
      const speedIncrease = RUN_SPEED_BASE * 0.02; 
      const nextSpeed = speed + speedIncrease;

      set({ 
        collectedLetters: newLetters,
        speed: nextSpeed
      });

      // Check if full word collected
      if (newLetters.length === TARGET_WORD.length) {
        if (level < MAX_LEVEL) {
            get().advanceLevel();
        } else {
            set({
                status: GameStatus.VICTORY,
                score: get().score + 5000
            });
        }
      }
    }
  },

  advanceLevel: () => {
      const { level, laneCount, speed, mycelialLinkCount } = get();
      const nextLevel = level + 1;
      
      const speedIncrease = RUN_SPEED_BASE * 0.10;
      const newSpeed = speed + speedIncrease;

      // Decrement Mycelial Link Stack (It lasts 1 level)
      const nextLinkCount = Math.max(0, mycelialLinkCount - 1);

      set({
          level: nextLevel,
          // Increase lanes (max 12)
          laneCount: Math.min(laneCount + 1, 12), 
          status: GameStatus.PLAYING, 
          speed: newSpeed,
          collectedLetters: [],
          mycelialLinkCount: nextLinkCount,
          // 5-second grace period to allow safe realignment of lanes and reaction time
          invulnerableUntil: Date.now() + 5000 
      });
  },

  openShop: () => set({ status: GameStatus.SHOP }),
  
  closeShop: () => set({ status: GameStatus.PLAYING }),

  buyItem: (type, cost) => {
      const { score, maxLives, lives, collectedLetters, mycelialLinkCount } = get();
      
      if (score >= cost) {
          set({ score: score - cost });
          
          switch (type) {
              case 'DOUBLE_JUMP':
                  set({ hasDoubleJump: true });
                  break;
              case 'MAX_LIFE':
                  set({ maxLives: maxLives + 1, lives: lives + 1 });
                  break;
              case 'HEAL':
                  set({ lives: Math.min(lives + 1, maxLives) });
                  break;
              case 'IMMORTAL':
                  set({ hasImmortality: true });
                  break;
              case 'MYCELIAL_LINK':
                  // Stacks count
                  set({ mycelialLinkCount: mycelialLinkCount + 1 });
                  
                  // Apply immediately if we have current letters that match logic
                  const newLetters = [...collectedLetters];
                  let changed = false;
                  collectedLetters.forEach(idx => {
                       const char = TARGET_WORD[idx];
                       TARGET_WORD.forEach((c, i) => {
                          if (c === char && i !== idx && !newLetters.includes(i)) {
                              newLetters.push(i);
                              changed = true;
                          }
                       });
                  });
                  
                  if (changed) {
                      set({ collectedLetters: newLetters });
                      if (newLetters.length === TARGET_WORD.length) {
                           setTimeout(() => {
                               const { level } = get();
                               if (level < MAX_LEVEL) get().advanceLevel();
                               else set({ status: GameStatus.VICTORY, score: get().score + 5000 });
                           }, 500);
                      }
                  }
                  break;
              case 'MAGNETIC_FIELD':
                  // Set for 20 seconds from now
                  set({ magnetEndTime: Date.now() + 20000 });
                  break;
          }
          return true;
      }
      return false;
  },

  activateImmortality: () => {
      const { hasImmortality, isImmortalityActive } = get();
      if (hasImmortality && !isImmortalityActive) {
          set({ isImmortalityActive: true });
          
          setTimeout(() => {
              set({ isImmortalityActive: false });
          }, 5000);
      }
  },

  setStatus: (status) => set({ status }),
  increaseLevel: () => set((state) => ({ level: state.level + 1 })),
}));
