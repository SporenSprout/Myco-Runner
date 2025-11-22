
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center, Float } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, WORD_COLORS, TARGET_WORD } from '../../types';
import { audio } from '../System/Audio';

// Geometry Constants
const OBSTACLE_HEIGHT = 1.6;
const OBSTACLE_GEOMETRY = new THREE.ConeGeometry(0.9, OBSTACLE_HEIGHT, 6);
const OBSTACLE_GLOW_GEO = new THREE.ConeGeometry(0.9, OBSTACLE_HEIGHT, 6);
const OBSTACLE_RING_GEO = new THREE.RingGeometry(0.6, 0.9, 6);

// Mushroom Geometries (Replaces Gem)
// Enhanced size for better visibility
const MUSHROOM_CAP_GEO = new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI/2);
const MUSHROOM_STEM_GEO = new THREE.CylinderGeometry(0.12, 0.18, 0.4, 8);

// Alien Geometries
const ALIEN_BODY_GEO = new THREE.CylinderGeometry(0.6, 0.3, 0.3, 8);
const ALIEN_DOME_GEO = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI/2);
const ALIEN_EYE_GEO = new THREE.SphereGeometry(0.1);

// Missile Geometries
const MISSILE_CORE_GEO = new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8);
const MISSILE_RING_GEO = new THREE.TorusGeometry(0.15, 0.02, 16, 32);

// Shadow Geometries
const SHADOW_LETTER_GEO = new THREE.PlaneGeometry(2, 0.6);
const SHADOW_GEM_GEO = new THREE.CircleGeometry(0.6, 32);
const SHADOW_ALIEN_GEO = new THREE.CircleGeometry(0.8, 32);
const SHADOW_MISSILE_GEO = new THREE.PlaneGeometry(0.15, 3);
const SHADOW_DEFAULT_GEO = new THREE.CircleGeometry(0.8, 6);

// Shop Geometries
const SHOP_FRAME_GEO = new THREE.BoxGeometry(1, 7, 1); // Will be scaled
const SHOP_BACK_GEO = new THREE.BoxGeometry(1, 5, 1.2); // Will be scaled
const SHOP_OUTLINE_GEO = new THREE.BoxGeometry(1, 7.2, 0.8); // Will be scaled
const SHOP_FLOOR_GEO = new THREE.PlaneGeometry(1, 4); // Will be scaled

const PARTICLE_COUNT = 600;
const BASE_LETTER_INTERVAL = 100; 

const getLetterInterval = (level: number) => {
    // Interval scales slightly with level. Tuned down to 1.1 power for 10 levels.
    return BASE_LETTER_INTERVAL * Math.pow(1.1, Math.max(0, level - 1));
};

// Helper for Even/Odd Lane Support
const getLaneIndices = (laneCount: number) => {
    const indices = [];
    const maxIndex = (laneCount - 1) / 2;
    for (let i = 0; i < laneCount; i++) {
        indices.push(-maxIndex + i);
    }
    return indices;
};

const getRandomLane = (laneCount: number) => {
    const lanes = getLaneIndices(laneCount);
    return lanes[Math.floor(Math.random() * lanes.length)];
};

const MISSILE_SPEED = 30; // Extra speed added to world speed

// Font for 3D Text
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

// --- Particle System ---
const ParticleSystem: React.FC = () => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => new Array(PARTICLE_COUNT).fill(0).map(() => ({
        life: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        color: new THREE.Color()
    })), []);

    useEffect(() => {
        const handleExplosion = (e: CustomEvent) => {
            const { position, color } = e.detail;
            let spawned = 0;
            const burstAmount = 40; 

            for(let i = 0; i < PARTICLE_COUNT; i++) {
                const p = particles[i];
                if (p.life <= 0) {
                    p.life = 1.0 + Math.random() * 0.5; 
                    p.pos.set(position[0], position[1], position[2]);
                    
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = 2 + Math.random() * 10;
                    
                    p.vel.set(
                        Math.sin(phi) * Math.cos(theta),
                        Math.sin(phi) * Math.sin(theta),
                        Math.cos(phi)
                    ).multiplyScalar(speed);

                    p.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    p.rotVel.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(5);
                    
                    p.color.set(color);
                    
                    spawned++;
                    if (spawned >= burstAmount) break;
                }
            }
        };
        
        window.addEventListener('particle-burst', handleExplosion as any);
        return () => window.removeEventListener('particle-burst', handleExplosion as any);
    }, [particles]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const safeDelta = Math.min(delta, 0.1);

        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= safeDelta * 1.5;
                p.pos.addScaledVector(p.vel, safeDelta);
                p.vel.y -= safeDelta * 5; 
                p.vel.multiplyScalar(0.98);

                p.rot.x += p.rotVel.x * safeDelta;
                p.rot.y += p.rotVel.y * safeDelta;
                
                dummy.position.copy(p.pos);
                const scale = Math.max(0, p.life * 0.25);
                dummy.scale.set(scale, scale, scale);
                
                dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
                dummy.updateMatrix();
                
                mesh.current!.setMatrixAt(i, dummy.matrix);
                mesh.current!.setColorAt(i, p.color);
            } else {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
        </instancedMesh>
    );
};


export const LevelManager: React.FC = () => {
  const { 
    status, 
    speed, 
    collectGem, 
    collectLetter, 
    collectedLetters,
    laneCount,
    setDistance,
    openShop,
    level,
    magnetEndTime
  } = useStore();
  
  const objectsRef = useRef<GameObject[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);

  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(BASE_LETTER_INTERVAL);

  // Sequence Refs
  const gemSequenceRemaining = useRef(0);
  const gemSequenceLane = useRef(0);

  // Safe Zone Ref
  const safeSpawnUntil = useRef(0);

  // Handle resets and transitions
  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && prevStatus.current === GameStatus.GAME_OVER;
    const isMenuReset = status === GameStatus.MENU;
    const isLevelUp = level !== prevLevel.current && status === GameStatus.PLAYING;
    const isVictoryReset = status === GameStatus.PLAYING && prevStatus.current === GameStatus.VICTORY;

    if (isMenuReset || isRestart || isVictoryReset) {
        // Hard Reset of objects
        objectsRef.current = [];
        setRenderTrigger(t => t + 1);
        
        // Reset trackers
        distanceTraveled.current = 0;
        nextLetterDistance.current = getLetterInterval(1);
        gemSequenceRemaining.current = 0;
        safeSpawnUntil.current = Date.now() + 3000; // Safe zone for start

    } else if (isLevelUp && level > 1) {
        // Soft Reset for Level Up (Transition to new Lane Count)
        // CRITICAL: Clear ALL objects because the lane grid has changed (e.g., 3 lanes to 4 lanes).
        objectsRef.current = [];

        // Spawn Shop Portal further out
        objectsRef.current.push({
            id: uuidv4(),
            type: ObjectType.SHOP_PORTAL,
            position: [0, 0, -100], 
            active: true,
        });
        
        nextLetterDistance.current = distanceTraveled.current - SPAWN_DISTANCE + getLetterInterval(level);
        gemSequenceRemaining.current = 0;
        safeSpawnUntil.current = Date.now() + 3000; // Safe zone for level transition
        
        setRenderTrigger(t => t + 1);
        
    } else if (status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
        setDistance(Math.floor(distanceTraveled.current));
    }
    
    prevStatus.current = status;
    prevLevel.current = level;
  }, [status, level, setDistance]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) {
              playerObjRef.current = group.children[0];
          }
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    const dist = speed * safeDelta;
    
    distanceTraveled.current += dist;

    const hasMagneticField = Date.now() < magnetEndTime;

    let hasChanges = false;
    let playerPos = new THREE.Vector3(0, 0, 0);
    
    if (playerObjRef.current) {
        playerObjRef.current.getWorldPosition(playerPos);
    }

    // 1. Move & Update
    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    for (const obj of currentObjects) {
        // Check for redundant letters (collected via upgrade or logic change)
        if (obj.active && obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) {
             if (collectedLetters.includes(obj.targetIndex)) {
                 window.dispatchEvent(new CustomEvent('particle-burst', { 
                     detail: { 
                         position: obj.position, 
                         color: obj.color || '#ffffff' 
                     } 
                 }));
                 obj.active = false;
                 hasChanges = true;
             }
        }

        if (!obj.active) continue;

        // Standard Movement
        let moveAmount = dist;
        
        // Missile Movement (Moves faster than world)
        if (obj.type === ObjectType.MISSILE) {
            moveAmount += MISSILE_SPEED * safeDelta;
        }

        // Store previous Z for swept collision check (prevents tunneling)
        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;

        // --- MAGNETIC FIELD LOGIC ---
        if (hasMagneticField && (obj.type === ObjectType.GEM || obj.type === ObjectType.LETTER) && obj.active) {
            const relZ = obj.position[2] - playerPos.z;
            
            // Dynamic Lookahead
            const lookAhead = 15 + (speed * 0.4);
            
            if (relZ < lookAhead && relZ > -2) {
                 const dx = obj.position[0] - playerPos.x;
                 const absDx = Math.abs(dx);
                 
                 // Effective Reach Calculation
                 // Base Reach: 3.2 (Covers 1 lane @ 2.2u, excludes 2 lanes @ 4.4u)
                 // Grows with speed.
                 // At Speed 28 (Lvl 2+): Reach starts growing.
                 // At Speed 60 (Lvl 10): Reach ~3.2 + 32*0.15 = ~8.0 (Covers 3 lanes).
                 const effectiveReach = 3.2 + Math.max(0, (speed - 28) * 0.15);

                 // Strength logic
                 let strength = 0;
                 
                 if (absDx <= effectiveReach) {
                     // Strong Capture Pull
                     // Scales with speed to ensure capture at high velocities
                     strength = (5.0 + speed * 0.4) * safeDelta;
                 } else {
                     // Weak "Tease" Pull
                     // Just enough to show the magnet is working, but won't capture distant items before they pass
                     strength = 0.5 * safeDelta; 
                 }
                 
                 // Clamp to prevent overshooting/instability
                 strength = Math.min(0.8, strength);

                 obj.position[0] = THREE.MathUtils.lerp(obj.position[0], playerPos.x, strength);
                 obj.position[1] = THREE.MathUtils.lerp(obj.position[1], playerPos.y + 0.5, strength);
            }
        }

        
        // Alien AI Logic
        if (obj.type === ObjectType.ALIEN && obj.active && !obj.hasFired) {
             // Fire when within range (e.g., -90 units away)
             if (obj.position[2] > -90) {
                 obj.hasFired = true;
                 
                 // Spawn Missile
                 newSpawns.push({
                     id: uuidv4(),
                     type: ObjectType.MISSILE,
                     position: [obj.position[0], 1.0, obj.position[2] + 2], // Spawn slightly in front
                     active: true,
                     color: '#ff0000'
                 });
                 hasChanges = true;
                 
                 // Visual flare event
                 window.dispatchEvent(new CustomEvent('particle-burst', { 
                    detail: { position: obj.position, color: '#ff00ff' } 
                 }));
             }
        }

        let keep = true;
        if (obj.active) {
            // Swept Collision: Check if object's path [prevZ, currentZ] overlaps with player collision zone
            const zThreshold = 2.0; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            // SHOP PORTAL COLLISION
            if (obj.type === ObjectType.SHOP_PORTAL) {
                // Strict proximity check for portal since it's large
                const dz = Math.abs(obj.position[2] - playerPos.z);
                if (dz < 2) { 
                     openShop();
                     obj.active = false;
                     hasChanges = true;
                     keep = false; 
                }
            } else if (inZZone) {
                // STANDARD COLLISION
                const dx = Math.abs(obj.position[0] - playerPos.x);
                if (dx < 0.9) { 
                     
                     // Obstacles, Aliens, and Missiles damage player
                     const isDamageSource = obj.type === ObjectType.OBSTACLE || obj.type === ObjectType.ALIEN || obj.type === ObjectType.MISSILE;
                     
                     if (isDamageSource) {
                         // VERTICAL COLLISION WITH BOUNDS CHECK
                         const playerBottom = playerPos.y;
                         const playerTop = playerPos.y + 1.8; 

                         let objBottom = obj.position[1] - 0.5;
                         let objTop = obj.position[1] + 0.5;

                         if (obj.type === ObjectType.OBSTACLE) {
                             objBottom = 0;
                             objTop = OBSTACLE_HEIGHT;
                         } else if (obj.type === ObjectType.MISSILE) {
                             // Missile at Y=1.0
                             objBottom = 0.5;
                             objTop = 1.5;
                         }

                         const isHit = (playerBottom < objTop) && (playerTop > objBottom);

                         if (isHit) { 
                             window.dispatchEvent(new Event('player-hit'));
                             obj.active = false; 
                             hasChanges = true;
                             
                             // Visual burst for missile impact
                             if (obj.type === ObjectType.MISSILE) {
                                window.dispatchEvent(new CustomEvent('particle-burst', { 
                                    detail: { position: obj.position, color: '#ff4400' } 
                                }));
                             }
                         }
                     } else {
                         // Item Collection
                         const dy = Math.abs(obj.position[1] - playerPos.y);
                         if (dy < 2.5) { 
                            if (obj.type === ObjectType.GEM) {
                                collectGem(obj.points || 50);
                                audio.playGemCollect();
                            }
                            if (obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) {
                                collectLetter(obj.targetIndex);
                                audio.playLetterCollect();
                            }
                            
                            window.dispatchEvent(new CustomEvent('particle-burst', { 
                                detail: { 
                                    position: obj.position, 
                                    color: obj.color || '#ffffff' 
                                } 
                            }));

                            obj.active = false;
                            hasChanges = true;
                         }
                     }
                }
            }
        }

        if (obj.position[2] > REMOVE_DISTANCE) {
            keep = false;
            hasChanges = true;
        }

        if (keep) {
            keptObjects.push(obj);
        }
    }

    // Add any newly spawned entities (Missiles)
    if (newSpawns.length > 0) {
        keptObjects.push(...newSpawns);
    }

    // 2. Spawning Logic
    let furthestZ = 0;
    // Only consider static obstacles/gems for gap calculation, not missiles or moving aliens
    const staticObjects = keptObjects.filter(o => o.type !== ObjectType.MISSILE);
    
    if (staticObjects.length > 0) {
        furthestZ = Math.min(...staticObjects.map(o => o.position[2]));
    } else {
        furthestZ = -20;
    }

    if (furthestZ > -SPAWN_DISTANCE) {
         // Dynamic Gap Calculation - LESS EMPTY SPACE IN HIGHER LEVELS
         // Lvl 1: 12 + speed*0.3 - 0.8 = ~20 gap
         // Lvl 10: 12 + speed*0.3 - 8 = ~12 gap (Much tighter)
         let minGap = Math.max(6, (12 + (speed * 0.3)) - (level * 0.8));
         
         const isSequenceActive = gemSequenceRemaining.current > 0;
         if (isSequenceActive) {
             minGap = 5 + (speed * 0.15); 
         }

         const spawnZ = Math.min(furthestZ - minGap, -SPAWN_DISTANCE);
         
         // CHECK FOR SAFE ZONE (Invulnerability Window)
         const isSafeTime = Date.now() < safeSpawnUntil.current;

         if (isSequenceActive) {
             // Continue spawning mushroom line
             let lane = gemSequenceLane.current;
             const maxIndex = (laneCount - 1) / 2;
             if (lane > maxIndex) lane = maxIndex;
             if (lane < -maxIndex) lane = -maxIndex;

             keptObjects.push({
                id: uuidv4(),
                type: ObjectType.GEM,
                position: [lane * LANE_WIDTH, 1.2, spawnZ],
                active: true,
                color: '#00ffff',
                points: 50
             });
             gemSequenceRemaining.current--;
             hasChanges = true;

         } else {
             const isLetterDue = distanceTraveled.current >= nextLetterDistance.current;

             if (isLetterDue) {
                 const lane = getRandomLane(laneCount);
                 let availableIndices = TARGET_WORD.map((_, i) => i).filter(i => !collectedLetters.includes(i));
                 
                 const activeLetterIndices = keptObjects
                     .filter(obj => obj.type === ObjectType.LETTER && obj.active && obj.targetIndex !== undefined)
                     .map(obj => obj.targetIndex!);
                
                 availableIndices = availableIndices.filter(i => !activeLetterIndices.includes(i));

                 if (availableIndices.length > 0) {
                     const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                     const val = TARGET_WORD[chosenIndex];
                     const color = WORD_COLORS[chosenIndex];

                     keptObjects.push({
                        id: uuidv4(),
                        type: ObjectType.LETTER,
                        position: [lane * LANE_WIDTH, 1.0, spawnZ], 
                        active: true,
                        color: color,
                        value: val,
                        targetIndex: chosenIndex
                     });
                     
                     nextLetterDistance.current += getLetterInterval(level);
                     hasChanges = true;
                 } else {
                    keptObjects.push({
                        id: uuidv4(),
                        type: ObjectType.GEM,
                        position: [lane * LANE_WIDTH, 1.2, spawnZ],
                        active: true,
                        color: '#00ffff',
                        points: 50
                    });
                    hasChanges = true;
                 }

             } else if (Math.random() > 0.1) { 
                
                if (isSafeTime) {
                    // Safe zone: High chance for single spores
                    if (Math.random() < 0.4) {
                         const lane = getRandomLane(laneCount);
                         keptObjects.push({
                             id: uuidv4(),
                             type: ObjectType.GEM,
                             position: [lane * LANE_WIDTH, 1.2, spawnZ],
                             active: true,
                             color: '#00ffff',
                             points: 50
                         });
                         hasChanges = true;
                    }
                } else {
                    // NORMAL LOGIC - SCALED FOR ACTION
                    
                    // Gem/Mushroom Chance increases with level
                    // Lvl 1: 0.34, Lvl 10: 0.7 (70% chance for spores vs obstacles)
                    const gemChance = Math.min(0.3 + (level * 0.04), 0.7);
                    const isGemSpawn = Math.random() < gemChance;

                    if (isGemSpawn) {
                         // Sequence (Line of Mushrooms) Chance
                         // Lvl 1: 0.2, Lvl 10: 0.65
                         const sequenceChance = Math.min(0.15 + (level * 0.05), 0.65);

                         if (Math.random() < sequenceChance) {
                             // Longer sequences at higher levels
                             // Lvl 1: 3-5 mushrooms
                             // Lvl 10: 3-8 mushrooms
                             const count = 3 + Math.floor(Math.random() * (3 + level * 0.5));
                             gemSequenceRemaining.current = count - 1; 
                             gemSequenceLane.current = getRandomLane(laneCount);
                             
                             keptObjects.push({
                                 id: uuidv4(),
                                 type: ObjectType.GEM,
                                 position: [gemSequenceLane.current * LANE_WIDTH, 1.2, spawnZ],
                                 active: true,
                                 color: '#00ffff',
                                 points: 50
                             });
                         } else {
                             // Single Spore
                             const lane = getRandomLane(laneCount);
                             keptObjects.push({
                                 id: uuidv4(),
                                 type: ObjectType.GEM,
                                 position: [lane * LANE_WIDTH, 1.2, spawnZ],
                                 active: true,
                                 color: '#00ffff',
                                 points: 50
                             });
                         }
                    } else {
                        // OBSTACLE SPAWNING
                        // Alien Chance: 0.15 + level factor
                        const spawnAlien = Math.random() < (0.15 + level * 0.01); 

                        if (spawnAlien) {
                            const availableLanes = getLaneIndices(laneCount);
                            availableLanes.sort(() => Math.random() - 0.5);

                            // Aliens scale exponentially: 2^(level-1)
                            // Lvl 1: 1, Lvl 2: 2, Lvl 3: 4...
                            // But capped by available lanes - 1 (always leave 1 lane free)
                            let maxAliens = Math.pow(2, level - 1);
                            
                            // Ensure we don't block every lane
                            const safeMax = Math.max(1, availableLanes.length - 1);
                            let alienCount = Math.min(maxAliens, safeMax);

                            for (let k = 0; k < alienCount; k++) {
                                const lane = availableLanes[k];
                                
                                // SCATTERED ALIENS PAST LEVEL 3
                                let zOffset = 0;
                                if (level > 3) {
                                    // Random offset between 0 and 40 units deep
                                    zOffset = Math.random() * 40;
                                }

                                keptObjects.push({
                                    id: uuidv4(),
                                    type: ObjectType.ALIEN,
                                    position: [lane * LANE_WIDTH, 1.5, spawnZ - zOffset],
                                    active: true,
                                    color: '#00ff00',
                                    hasFired: false
                                });
                            }
                        } else {
                            // Standard Obstacle Spawning - Denser at high levels
                            const availableLanes = getLaneIndices(laneCount);
                            availableLanes.sort(() => Math.random() - 0.5);
                            
                            let countToSpawn = 1;
                            const p = Math.random();
                            
                            // Aggressively scale multi-lane obstacles
                            const threshold3 = Math.max(0.3, 0.9 - (level * 0.05)); // Lvl 10: 0.4 threshold for 3
                            const threshold2 = Math.max(0.1, 0.6 - (level * 0.04)); // Lvl 10: 0.2 threshold for 2

                            if (p > threshold3) {
                                countToSpawn = Math.min(3, availableLanes.length);
                            } else if (p > threshold2) {
                                countToSpawn = Math.min(2, availableLanes.length);
                            }

                            for (let i = 0; i < countToSpawn; i++) {
                                const lane = availableLanes[i];
                                const laneX = lane * LANE_WIDTH;
                                
                                keptObjects.push({
                                    id: uuidv4(),
                                    type: ObjectType.OBSTACLE,
                                    position: [laneX, OBSTACLE_HEIGHT / 2, spawnZ],
                                    active: true,
                                    color: '#ff0054'
                                });

                                // Chance for gem on top
                                if (Math.random() < 0.2) {
                                     keptObjects.push({
                                        id: uuidv4(),
                                        type: ObjectType.GEM,
                                        position: [laneX, OBSTACLE_HEIGHT + 1.0, spawnZ],
                                        active: true,
                                        color: '#ffd700',
                                        points: 100
                                    });
                                }
                            }
                        }
                    }
                }
                hasChanges = true;
             }
         }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      <ParticleSystem />
      {objectsRef.current.map(obj => {
        if (!obj.active) return null;
        return <GameEntity key={obj.id} data={obj} />;
      })}
    </group>
  );
};

const GameEntity: React.FC<{ data: GameObject }> = React.memo(({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const visualRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);
    const { laneCount } = useStore();
    
    useFrame((state, delta) => {
        // 1. Move Main Container
        if (groupRef.current) {
            groupRef.current.position.set(data.position[0], 0, data.position[2]);
        }

        // 2. Animate Visuals
        if (visualRef.current) {
            const baseHeight = data.position[1];
            
            if (data.type === ObjectType.SHOP_PORTAL) {
                 visualRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.02);
            } else if (data.type === ObjectType.MISSILE) {
                 // Missile rotation
                 visualRef.current.rotation.z += delta * 20; // Fast spin
                 visualRef.current.position.y = baseHeight;
            } else if (data.type === ObjectType.ALIEN) {
                 // Alien Hover
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3) * 0.2;
                 visualRef.current.rotation.y += delta;
            } else if (data.type !== ObjectType.OBSTACLE) {
                // Gem/Letter Bobbing
                visualRef.current.rotation.y += delta * 3;
                const bobOffset = Math.sin(state.clock.elapsedTime * 4 + data.position[0]) * 0.1;
                visualRef.current.position.y = baseHeight + bobOffset;
                
                if (shadowRef.current) {
                    const shadowScale = 1 - bobOffset; 
                    shadowRef.current.scale.setScalar(shadowScale);
                }
            } else {
                visualRef.current.position.y = baseHeight;
            }
        }
    });

    // Select Shadow Geometry based on type (using shared geometries)
    const shadowGeo = useMemo(() => {
        if (data.type === ObjectType.LETTER) return SHADOW_LETTER_GEO;
        if (data.type === ObjectType.GEM) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.SHOP_PORTAL) return null; // No shadow needed or custom handled
        if (data.type === ObjectType.ALIEN) return SHADOW_ALIEN_GEO;
        if (data.type === ObjectType.MISSILE) return SHADOW_MISSILE_GEO;
        return SHADOW_DEFAULT_GEO; 
    }, [data.type]);

    return (
        <group ref={groupRef} position={[data.position[0], 0, data.position[2]]}>
            {data.type !== ObjectType.SHOP_PORTAL && shadowGeo && (
                <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={shadowGeo}>
                    <meshBasicMaterial color="#000000" opacity={0.3} transparent />
                </mesh>
            )}

            <group ref={visualRef} position={[0, data.position[1], 0]}>
                {/* --- SHOP PORTAL --- */}
                {data.type === ObjectType.SHOP_PORTAL && (
                    <group>
                         <mesh position={[0, 3, 0]} geometry={SHOP_FRAME_GEO} scale={[laneCount * LANE_WIDTH + 2, 1, 1]}>
                             <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
                         </mesh>
                         <mesh position={[0, 2, 0]} geometry={SHOP_BACK_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]}>
                              <meshBasicMaterial color="#000000" />
                         </mesh>
                         <mesh position={[0, 3, 0]} geometry={SHOP_OUTLINE_GEO} scale={[laneCount * LANE_WIDTH + 2.2, 1, 1]}>
                             <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.3} />
                         </mesh>
                         <Center position={[0, 5, 0.6]}>
                             <Text3D font={FONT_URL} size={1.2} height={0.2}>
                                 SPORE STORE
                                 <meshBasicMaterial color="#ffff00" />
                             </Text3D>
                         </Center>
                         <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={SHOP_FLOOR_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]}>
                             <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
                         </mesh>
                    </group>
                )}

                {/* --- OBSTACLE --- */}
                {data.type === ObjectType.OBSTACLE && (
                    <group>
                        <mesh geometry={OBSTACLE_GEOMETRY} castShadow receiveShadow>
                             <meshStandardMaterial 
                                 color="#330011"
                                 roughness={0.3} 
                                 metalness={0.8} 
                                 flatShading={true}
                             />
                        </mesh>
                        <mesh scale={[1.02, 1.02, 1.02]} geometry={OBSTACLE_GLOW_GEO}>
                             <meshBasicMaterial 
                                 color={data.color} 
                                 wireframe 
                                 transparent 
                                 opacity={0.3} 
                             />
                        </mesh>
                         <mesh position={[0, -OBSTACLE_HEIGHT/2 + 0.05, 0]} rotation={[-Math.PI/2,0,0]} geometry={OBSTACLE_RING_GEO}>
                             <meshBasicMaterial color={data.color} transparent opacity={0.4} side={THREE.DoubleSide} />
                         </mesh>
                    </group>
                )}

                {/* --- ALIEN (LEVEL 2+) --- */}
                {data.type === ObjectType.ALIEN && (
                    <group>
                        {/* Saucer Body */}
                        <mesh castShadow geometry={ALIEN_BODY_GEO}>
                            <meshStandardMaterial color="#4400cc" metalness={0.8} roughness={0.2} />
                        </mesh>
                        {/* Dome */}
                        <mesh position={[0, 0.2, 0]} geometry={ALIEN_DOME_GEO}>
                            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} transparent opacity={0.8} />
                        </mesh>
                        {/* Glowing Eyes/Lights */}
                        <mesh position={[0.3, 0, 0.3]} geometry={ALIEN_EYE_GEO}>
                             <meshBasicMaterial color="#ff00ff" />
                        </mesh>
                        <mesh position={[-0.3, 0, 0.3]} geometry={ALIEN_EYE_GEO}>
                             <meshBasicMaterial color="#ff00ff" />
                        </mesh>
                    </group>
                )}

                {/* --- MISSILE (Long Laser) --- */}
                {data.type === ObjectType.MISSILE && (
                    <group rotation={[Math.PI / 2, 0, 0]}>
                        {/* Long glowing core: Oriented along Y (which is Z after rotation) */}
                        <mesh geometry={MISSILE_CORE_GEO}>
                            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={4} />
                        </mesh>
                        {/* Energy Rings */}
                        <mesh position={[0, 1.0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                        <mesh position={[0, 0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                        <mesh position={[0, -1.0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                    </group>
                )}

                {/* --- GEM (NOW MUSHROOM) --- */}
                {data.type === ObjectType.GEM && (
                    <group scale={[1.5, 1.5, 1.5]}>
                        {/* Cap */}
                        <mesh position={[0, 0.15, 0]} castShadow geometry={MUSHROOM_CAP_GEO}>
                             <meshStandardMaterial 
                                color={data.color} 
                                roughness={0.2} 
                                metalness={0.5} 
                                emissive={data.color} 
                                emissiveIntensity={1.5} 
                             />
                        </mesh>
                        {/* Stem - Now Glowing */}
                        <mesh position={[0, -0.25, 0]} castShadow geometry={MUSHROOM_STEM_GEO}>
                             <meshStandardMaterial 
                                color={data.color} 
                                roughness={0.2}
                                emissive={data.color}
                                emissiveIntensity={0.8}
                             />
                        </mesh>
                    </group>
                )}

                {/* --- LETTER --- */}
                {data.type === ObjectType.LETTER && (
                    <group scale={[1.5, 1.5, 1.5]}>
                         <Center>
                             <Text3D 
                                font={FONT_URL} 
                                size={0.8} 
                                height={0.5} 
                                bevelEnabled
                                bevelThickness={0.02}
                                bevelSize={0.02}
                                bevelSegments={5}
                             >
                                {data.value}
                                <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={1.5} />
                             </Text3D>
                         </Center>
                    </group>
                )}
            </group>
        </group>
    );
});
