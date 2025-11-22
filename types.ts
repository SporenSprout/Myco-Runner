/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE',
  GEM = 'GEM',
  LETTER = 'LETTER',
  SHOP_PORTAL = 'SHOP_PORTAL',
  ALIEN = 'ALIEN',
  MISSILE = 'MISSILE'
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  value?: string; // For letters
  color?: string;
  targetIndex?: number; // Index in the target word
  points?: number; // Score value for gems
  hasFired?: boolean; // For Aliens
}

export const LANE_WIDTH = 2.2;
export const JUMP_HEIGHT = 2.5;
export const JUMP_DURATION = 0.6; // seconds
export const RUN_SPEED_BASE = 22.5;
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20; // Behind player

// Centralized Target Word
export const TARGET_WORD = ['S', 'P', 'O', 'R', 'E', 'N', 'S', 'P', 'R', 'O', 'U', 'T'];

// Colors for "SPORENSPROUT" (12 chars)
export const WORD_COLORS = [
    '#2979ff', // S - Blue
    '#ff1744', // P - Red
    '#ffea00', // O - Yellow
    '#00e676', // R - Green
    '#d500f9', // E - Purple
    '#00bcd4', // N - Cyan
    '#2979ff', // S - Blue
    '#ff1744', // P - Red
    '#00e676', // R - Green
    '#ffea00', // O - Yellow
    '#ff9100', // U - Orange
    '#f50057', // T - Pink
];

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; // Lucide icon component
    oneTime?: boolean; // If true, remove from pool after buying
}

// Type augmentation for React Three Fiber intrinsic elements
// This fixes TS errors where <mesh>, <group>, etc. are not recognized on JSX.IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
