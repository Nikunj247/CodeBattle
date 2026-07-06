export const PROBLEM_TOPICS = [
  "Array",
  "Linked List",
  "String",
  "Math",
  "Backtracking",
  "Dynamic Programming",
  "Tree",
  "Stack",
  "Breadth-first Search",
  "Depth-first Search",
  "Binary Search"
];

export const getRankInfo = (elo) => {
  const ranks = [
    { name: 'Iron', min: 0, max: 999, color: 'text-zinc-600', bg: 'bg-zinc-600', border: 'border-zinc-600' },
    { name: 'Bronze I', min: 1000, max: 1049, color: 'text-orange-700', bg: 'bg-orange-700', border: 'border-orange-700' },
    { name: 'Bronze II', min: 1050, max: 1099, color: 'text-orange-700', bg: 'bg-orange-700', border: 'border-orange-700' },
    { name: 'Bronze III', min: 1100, max: 1149, color: 'text-orange-700', bg: 'bg-orange-700', border: 'border-orange-700' },
    { name: 'Silver I', min: 1150, max: 1199, color: 'text-zinc-400', bg: 'bg-zinc-400', border: 'border-zinc-400' },
    { name: 'Silver II', min: 1200, max: 1249, color: 'text-zinc-400', bg: 'bg-zinc-400', border: 'border-zinc-400' },
    { name: 'Silver III', min: 1250, max: 1299, color: 'text-zinc-400', bg: 'bg-zinc-400', border: 'border-zinc-400' },
    { name: 'Gold I', min: 1300, max: 1349, color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400' },
    { name: 'Gold II', min: 1350, max: 1399, color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400' },
    { name: 'Gold III', min: 1400, max: 1449, color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400' },
    { name: 'Platinum I', min: 1450, max: 1499, color: 'text-cyan-400', bg: 'bg-cyan-400', border: 'border-cyan-400' },
    { name: 'Platinum II', min: 1500, max: 1549, color: 'text-cyan-400', bg: 'bg-cyan-400', border: 'border-cyan-400' },
    { name: 'Platinum III', min: 1550, max: 1599, color: 'text-cyan-400', bg: 'bg-cyan-400', border: 'border-cyan-400' },
    { name: 'Diamond I', min: 1600, max: 1649, color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500' },
    { name: 'Diamond II', min: 1650, max: 1699, color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500' },
    { name: 'Diamond III', min: 1700, max: 1749, color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500' },
    { name: 'Champion I', min: 1750, max: 1849, color: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500' },
    { name: 'Champion II', min: 1850, max: 1949, color: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500' },
    { name: 'Champion III', min: 1950, max: 1999, color: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500' },
    { name: 'Grand Champion', min: 2000, max: Infinity, color: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-500' }
  ];
  return ranks.find(r => elo >= r.min && elo <= r.max) || ranks[0];
};

// src/utils/constants.js

export const BADGE_DEFINITIONS = [
  // Firsts
  { id: 'first_blood', name: 'First Blood', description: 'Win your first ranked match', iconName: 'Flame', color: 'text-orange-500', border: 'border-orange-500' },
  
  // Matches Played (Veteran)
  { id: 'veteran_1', name: 'Veteran I', description: 'Play 10 ranked matches', iconName: 'Shield', color: 'text-emerald-500', border: 'border-emerald-500' },
  { id: 'veteran_2', name: 'Veteran II', description: 'Play 50 ranked matches', iconName: 'Shield', color: 'text-emerald-400', border: 'border-emerald-400' },
  { id: 'veteran_3', name: 'Veteran III', description: 'Play 100 ranked matches', iconName: 'Shield', color: 'text-emerald-300', border: 'border-emerald-300' },
  
  // Win Streaks
  { id: 'streak_3', name: 'Heating Up', description: 'Achieve a 3-match win streak', iconName: 'Zap', color: 'text-amber-500', border: 'border-amber-500' },
  { id: 'streak_5', name: 'On Fire', description: 'Achieve a 5-match win streak', iconName: 'Zap', color: 'text-yellow-400', border: 'border-yellow-400' },
  { id: 'streak_10', name: 'Unstoppable', description: 'Achieve a 10-match win streak', iconName: 'Zap', color: 'text-rose-500', border: 'border-rose-500' },
  { id: 'streak_20', name: 'Godlike', description: 'Achieve a 20-match win streak', iconName: 'Flame', color: 'text-fuchsia-500', border: 'border-fuchsia-500' }, // <-- NEW

  // Rating Milestones
  { id: 'elo_silver', name: 'Silver Surfer', description: 'Reach Silver Tier (1150+)', iconName: 'Target', color: 'text-zinc-300', border: 'border-zinc-300' },
  { id: 'elo_gold', name: 'Gold Standard', description: 'Reach Gold Tier (1300+)', iconName: 'Crown', color: 'text-yellow-500', border: 'border-yellow-500' },
  { id: 'elo_platinum', name: 'Platinum Prodigy', description: 'Reach Platinum Tier (1450+)', iconName: 'Star', color: 'text-cyan-400', border: 'border-cyan-400' },
  { id: 'elo_diamond', name: 'Diamond Hands', description: 'Reach Diamond Tier (1600+)', iconName: 'Diamond', color: 'text-blue-500', border: 'border-blue-500' },
  { id: 'elo_champion', name: 'Champion', description: 'Reach Champion Tier (1750+)', iconName: 'Swords', color: 'text-purple-500', border: 'border-purple-500' }, // <-- NEW
  { id: 'elo_grand_champion', name: 'Grand Champion', description: 'Reach Grand Champion (2000+)', iconName: 'Trophy', color: 'text-rose-600', border: 'border-rose-600' }, // <-- NEW
];

export const getEarnedBadgeIds = (totalMatches, wins, currentStreak, currentElo) => {
  const earned = [];
  
  if (wins >= 1) earned.push('first_blood');
  
  if (totalMatches >= 10) earned.push('veteran_1');
  if (totalMatches >= 50) earned.push('veteran_2');
  if (totalMatches >= 100) earned.push('veteran_3');
  
  if (currentStreak >= 3) earned.push('streak_3');
  if (currentStreak >= 5) earned.push('streak_5');
  if (currentStreak >= 10) earned.push('streak_10');
  if (currentStreak >= 20) earned.push('streak_20'); // <-- NEW
  
  if (currentElo >= 1150) earned.push('elo_silver');
  if (currentElo >= 1300) earned.push('elo_gold');
  if (currentElo >= 1600) earned.push('elo_diamond');
  if (currentElo >= 1750) earned.push('elo_champion'); // <-- NEW
  if (currentElo >= 2000) earned.push('elo_grand_champion'); // <-- NEW
  
  return earned;
};