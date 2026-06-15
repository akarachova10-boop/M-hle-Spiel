/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppTheme } from '../types';

export const APP_THEMES: AppTheme[] = [
  {
    id: 'natural-tones',
    name: 'Natural Tones',
    tagline: 'Digital Heritage Series',
    description: 'Eine sanfte Harmonie aus warmem Elfenbein (#FDFBF7), Salbeigrün (#5A5A40) und erdigem Holzkohlegrau. Zeitlos, ruhig und handwerklich präzise gefertigt.',
    bgClass: 'bg-[#FDFBF7] text-[#4A443F]',
    boardBg: '#FAF8F5',
    boardLines: '#3D3D3D',
    boardPoints: '#D7BA89',
    boardPointsActive: '#5A5A40',
    playerPiece: 'bg-[#EFECE7] border border-[#A69F95] shadow-[0_4px_10px_rgba(140,132,121,0.25)]',
    computerPiece: 'bg-[#2D2A26] border border-[#4A443F] shadow-[0_4px_10px_rgba(45,42,38,0.35)]',
    playerPiecePulse: 'rgba(239, 236, 231, 1)',
    computerPiecePulse: 'rgba(45, 42, 38, 1)',
    sidebarBg: 'bg-[#FAF8F5]/95 border-[#E5E0D8]',
    textMuted: 'text-[#8C8479]',
    textPrimary: 'text-[#2D2A26]',
    buttonPrimary: 'bg-[#5A5A40] hover:bg-[#4A4A35] text-white',
    accentGlow: 'shadow-[0_4px_24px_rgba(90,90,64,0.1)]',
  },
  {
    id: 'classic-wood',
    name: 'Klassisches Holzbrett',
    tagline: 'Die traditionelle Haptik',
    description: 'Edle Walnuss- und Eichenholzoptik. Erweckt das Gefühl eines echten, handgeschnitzten Holzbrettes am gemütlichen Kaminfeuer.',
    bgClass: 'bg-radial from-[#321c0f] via-[#1a0e07] to-[#0a0502]',
    boardBg: '#4a2c1b',
    boardLines: '#d4af37', // Gold-gilded lines
    boardPoints: '#2c160a',
    boardPointsActive: '#f3e5ab',
    playerPiece: 'bg-radial from-[#ffffff] via-[#e5e5e5] to-[#acacac] border border-stone-400 shadow-[0_4px_10px_rgba(255,255,255,0.4)]',
    computerPiece: 'bg-radial from-[#454545] via-[#262626] to-[#0a0a0a] border border-stone-800 shadow-[0_4px_10px_rgba(0,0,0,0.6)]',
    playerPiecePulse: 'rgba(255, 255, 255, 0.4)',
    computerPiecePulse: 'rgba(0, 0, 0, 0.6)',
    sidebarBg: 'bg-[#211108]/90 border-stone-800',
    textMuted: 'text-[#d7ccc8]/75',
    textPrimary: 'text-[#efebe9]',
    buttonPrimary: 'bg-[#8d6e63] hover:bg-[#a1887f] text-[#efebe9] border border-[#a1887f]/30',
    accentGlow: 'shadow-[0_0_20px_#d4af37]',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    tagline: 'Die digitale Zukunft',
    description: 'Elektrische Neonlampen, dunkle Carbon-Vibrationen und leuchtende Synthwave-Farben für eine futuristische Arcade-Session.',
    bgClass: 'bg-[#030008] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d0e3b] via-[#050110] to-[#010003]',
    boardBg: '#090514',
    boardLines: '#00f0ff', // Cyan cyber lines
    boardPoints: '#1b0b2b',
    boardPointsActive: '#ff007f',
    playerPiece: 'bg-radial from-[#00f3ff] to-[#004f80] border border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.8)]',
    computerPiece: 'bg-radial from-[#ff0055] to-[#800020] border border-rose-500 shadow-[0_0_15px_rgba(255,0,85,0.8)]',
    playerPiecePulse: 'rgba(0, 243, 255, 0.5)',
    computerPiecePulse: 'rgba(255, 0, 85, 0.5)',
    sidebarBg: 'bg-[#0b061c]/90 border-cyan-950/40',
    textMuted: 'text-purple-300/60',
    textPrimary: 'text-purple-50',
    buttonPrimary: 'bg-gradient-to-r from-neon-cyan to-neon-magenta hover:opacity-90 text-white border-none shadow-[0_0_10px_rgba(147,51,234,0.5)]',
    accentGlow: 'shadow-[0_0_25px_rgba(0,240,255,0.45)]',
  },
  {
    id: 'modern-bauhaus',
    name: 'Bauhaus Minimalist',
    tagline: 'Skandinavische Klarheit',
    description: 'Hochkontrastreiches Layout im zeitlosen Schweizer Stil. Reduziert auf Ästhetik, Linienführung und pure Geometrie.',
    bgClass: 'bg-gradient-to-br from-[#f5f5f7] via-[#eaeae2] to-[#dfdfe0]',
    boardBg: '#ffffff',
    boardLines: '#1d1d1f', // Solid charcoal lines
    boardPoints: '#e5e5ea',
    boardPointsActive: '#d1d1d6',
    playerPiece: 'bg-[#ff3b30] border-2 border-stone-900 shadow-[0_4px_6px_rgba(0,0,0,0.15)]', // Bauhaus Red
    computerPiece: 'bg-[#ffcc00] border-2 border-stone-900 shadow-[0_4px_6px_rgba(0,0,0,0.15)]', // Bauhaus Yellow
    playerPiecePulse: 'rgba(255, 59, 48, 0.3)',
    computerPiecePulse: 'rgba(255, 204, 0, 0.3)',
    sidebarBg: 'bg-white/80 border-slate-200 backdrop-blur-md',
    textMuted: 'text-slate-500',
    textPrimary: 'text-slate-900',
    buttonPrimary: 'bg-stone-900 hover:bg-stone-800 text-[#f5f5f7]',
    accentGlow: 'shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
  },
  {
    id: 'royal-emerald',
    name: 'Königliches Smaragd',
    tagline: 'Aristokratisches Ambiente',
    description: 'Tiefgrüner Samt-Untergrund mit luxuriösen Messing- und Elfenbein-Spielfiguren für anspruchsvolle Strategen.',
    bgClass: 'bg-radial from-[#041d13] via-[#020e09] to-[#010604]',
    boardBg: '#0b3c2a', // Rich forest green felt
    boardLines: '#b89240', // Brass gold lines
    boardPoints: '#051f15',
    boardPointsActive: '#e6c785',
    playerPiece: 'bg-radial from-[#fffff0] via-[#f4ebd0] to-[#c8b185] border border-amber-300 shadow-[0_4px_8px_rgba(184,146,64,0.3)]', // Ivory
    computerPiece: 'bg-radial from-[#4a3b32] via-[#2c1e15] to-[#120804] border border-amber-900 shadow-[0_4px_8px_rgba(0,0,0,0.5)]', // Deep Onyx Walnut
    playerPiecePulse: 'rgba(230, 199, 133, 0.4)',
    computerPiecePulse: 'rgba(74, 59, 50, 0.4)',
    sidebarBg: 'bg-[#07241a]/95 border-emerald-950',
    textMuted: 'text-emerald-300/60',
    textPrimary: 'text-emerald-50',
    buttonPrimary: 'bg-[#b89240] hover:bg-[#c9a351] text-stone-950 font-medium',
    accentGlow: 'shadow-[0_0_20px_rgba(184,146,64,0.45)]',
  }
];
