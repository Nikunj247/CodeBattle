import mongoose from 'mongoose';
import xss from 'xss';
import Problem from '../models/Problem.js';
import User from '../models/User.js'; 
import Match from '../models/Match.js'; 

let queue = []; 
const activeRooms = {}; 
const privateDuels = {}; // === NEW: Stores waiting private duels ===
const disconnectTimers = {}; 
const chatRateLimits = {}; 

const INITIAL_ELO_RANGE = 50;  
const EXPANSION_PER_SECOND = 5; 
const MAX_ELO_RANGE = 400;      

let isMatchmakerRunning = false;

const calculateEarnedBadges = (totalMatches, wins, currentStreak, currentElo) => {
  const earned = [];
  if (wins >= 1) earned.push('first_blood');
  if (totalMatches >= 10) earned.push('veteran_1');
  if (totalMatches >= 50) earned.push('veteran_2');
  if (totalMatches >= 100) earned.push('veteran_3');
  if (currentStreak >= 3) earned.push('streak_3');
  if (currentStreak >= 5) earned.push('streak_5');
  if (currentStreak >= 10) earned.push('streak_10');
  if (currentStreak >= 20) earned.push('streak_20');
  if (currentElo >= 1150) earned.push('elo_silver');
  if (currentElo >= 1300) earned.push('elo_gold');
  if (currentElo >= 1450) earned.push('elo_platinum');
  if (currentElo >= 1600) earned.push('elo_diamond');
  if (currentElo >= 1750) earned.push('elo_champion');
  if (currentElo >= 2000) earned.push('elo_grand_champion');
  return earned;
};

const recordMatchResults = async (winner, loser, roomId, io, options = {}) => {
  const { isForfeit = false, isTimeoutWin = false, reason = null, isDraw = false } = options;
  const room = activeRooms[roomId];
  if (!room) return;

  if (isDraw) {
    io.to(roomId).emit('game_over', { 
      isDraw: true, 
      reason,
      codes: { // === NEW: Send final code even on a draw ===
        [room.player1.socketId]: room.player1.codes || {},
        [room.player2.socketId]: room.player2.codes || {}
      }
    });
    room.isFinished = true;
    setTimeout(() => { delete activeRooms[roomId]; }, 10000); 
    return;
  }

  try {
    const dbWinner = await User.findById(winner.userId);
    const dbLoser = await User.findById(loser.userId);
    if (!dbWinner || !dbLoser) return;

    let winnerGain = 0;
    let loserLoss = 0;
    let newlyUnlockedBadges = [];

    // === NEW: Only calculate Elo & Badges if it's a Ranked Match ===
    if (!room.isPrivate) {
      const expectedWinner = 1 / (1 + Math.pow(10, (dbLoser.eloRating - dbWinner.eloRating) / 400));
      const expectedLoser = 1 / (1 + Math.pow(10, (dbWinner.eloRating - dbLoser.eloRating) / 400));
      winnerGain = Math.max(1, Math.round(32 * (1 - expectedWinner)));
      loserLoss = Math.min(-1, Math.round(32 * (0 - expectedLoser)));

      try {
        await User.findByIdAndUpdate(winner.userId, { $inc: { eloRating: winnerGain } });
        await User.findByIdAndUpdate(loser.userId, { $inc: { eloRating: loserLoss } });
        
        await Match.create({
          players: [winner.userId, loser.userId],
          winner: winner.userId,
          loser: loser.userId,
          problems: room.problemIds,
          eloChanges: { winnerGain, loserLoss }
        });
      } catch (dbError) {
        console.error("Database update failed.", dbError);
        return; 
      }

      // Badge Calculation
      const playerMatches = await Match.find({ players: winner.userId });
      const totalMatchesCount = playerMatches.length;
      const winsCount = playerMatches.filter(m => String(m.winner) === String(winner.userId)).length;
      let currentStreak = 0;
      for (const m of playerMatches.sort((a, b) => b.createdAt - a.createdAt)) {
        if (String(m.winner) === String(winner.userId)) currentStreak++; else break;
      }

      const oldBadges = calculateEarnedBadges(totalMatchesCount - 1, winsCount - 1, Math.max(0, currentStreak - 1), dbWinner.eloRating);
      const newBadges = calculateEarnedBadges(totalMatchesCount, winsCount, currentStreak, dbWinner.eloRating + winnerGain);
      newlyUnlockedBadges = newBadges.filter(b => !oldBadges.includes(b));
    }

    const payload = {
      winnerId: winner.socketId, 
      winnerGain, 
      loserLoss,
      isForfeit,
      isTimeoutWin,
      reason: room.isPrivate ? `(Unranked Private Duel) ${reason || ''}` : reason,
      newlyUnlockedBadges,
      codes: { // === NEW: Send both players' synchronized code ===
        [room.player1.socketId]: room.player1.codes || {},
        [room.player2.socketId]: room.player2.codes || {}
      }
    };

    if (isForfeit && disconnectTimers[loser.userId]) {
      io.to(winner.socketId).emit('game_over', payload);
    } else {
      io.to(roomId).emit('game_over', payload);
    }
    
    room.isFinished = true;
    setTimeout(() => { delete activeRooms[roomId]; }, 10000); 

    console.log(`Match recorded. Winner +${winnerGain}, Loser ${loserLoss}`);
  } catch (error) {
    console.error("Failed to process match results:", error);
  }
};

const createActiveMatch = async (p1, p2, resolvedTopic, io, options = {}) => {
  const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
  const qCount = p1.questionCount;
  
  try {
    let randomProblems = [];
    const isTopicAll = !resolvedTopic || resolvedTopic === 'All' || resolvedTopic === 'Any';

    if (qCount === 1) {
      const query = {};
      if (!isTopicAll) query.$or = [{ topic: resolvedTopic }, { topics: resolvedTopic }];
      randomProblems = await Problem.aggregate([{ $match: query }, { $sample: { size: 1 } }]);
    } else {
      let requiredDifficulties = [];
      if (qCount === 2) requiredDifficulties = Math.random() > 0.5 ? ['Easy', 'Medium'] : ['Medium', 'Hard'];
      else if (qCount === 3) requiredDifficulties = ['Easy', 'Medium', 'Hard'];

      for (const diff of requiredDifficulties) {
        const query = { difficulty: diff };
        if (!isTopicAll) query.$or = [{ topic: resolvedTopic }, { topics: resolvedTopic }];
        const res = await Problem.aggregate([{ $match: query }, { $sample: { size: 1 } }]);
        if (res.length > 0) randomProblems.push(res[0]);
      }
    }

    if (randomProblems.length < qCount) {
      const errorMsg = `Not enough ${resolvedTopic} problems in the databanks to fulfill this match format.`;
      io.to(p1.socketId).emit('match_error', errorMsg);
      io.to(p2.socketId).emit('match_error', errorMsg);
      return; 
    }

    const serverStartTime = Date.now();
    const duration = qCount * 1800; 

    const problemsMap = {};
    randomProblems.forEach(p => {
      problemsMap[p.title] = p.difficulty === 'Hard' ? 500 : p.difficulty === 'Medium' ? 300 : 100;
    });

    activeRooms[roomId] = {
      player1: { socketId: p1.socketId, userId: p1.userId, solved: 0, score: 0, lastSolveTime: 0, codes: {} },
      player2: { socketId: p2.socketId, userId: p2.userId, solved: 0, score: 0, lastSolveTime: 0, codes: {} },
      problemIds: randomProblems.map(p => p._id),
      problemsMap: problemsMap, 
      startTime: serverStartTime,
      duration: duration,
      isProcessing: false,
      isFinished: false,
      isPrivate: options.isPrivate || false // === NEW: Private duel flag ===
    };

    console.log(`⚔️ MATCH CREATED: ${p1.userId} vs ${p2.userId} in ${roomId}`);

    const payload = { roomId, problemIds: activeRooms[roomId].problemIds, startTime: serverStartTime, duration };
    io.to(p1.socketId).emit('match_found', payload);
    io.to(p2.socketId).emit('match_found', payload);
  } catch (error) {
    console.error("Match Engine Creation Error:", error);
  }
};

export const handleSockets = (io) => {
  
  if (!isMatchmakerRunning) {
    isMatchmakerRunning = true;
    setInterval(async () => {
      if (queue.length < 2) return;

      const now = Date.now();
      queue.sort((a, b) => a.joinTime - b.joinTime);

      for (let i = 0; i < queue.length; i++) {
        const p1 = queue[i];
        if (!p1) continue;

        const p1WaitTime = Math.floor((now - p1.joinTime) / 1000);
        const p1Range = Math.min(INITIAL_ELO_RANGE + (p1WaitTime * EXPANSION_PER_SECOND), MAX_ELO_RANGE);

        for (let j = i + 1; j < queue.length; j++) {
           const p2 = queue[j];
           if (!p2) continue;
           
           if (p1.userId === p2.userId) continue; 
           if (p1.questionCount !== p2.questionCount) continue; 
           
           const topicMatch = p1.topic === p2.topic || p1.topic === 'All' || p2.topic === 'All';
           if (!topicMatch) continue;

           const p2WaitTime = Math.floor((now - p2.joinTime) / 1000);
           const p2Range = Math.min(INITIAL_ELO_RANGE + (p2WaitTime * EXPANSION_PER_SECOND), MAX_ELO_RANGE);

           const eloDiff = Math.abs(p1.eloRating - p2.eloRating);
           
           if (eloDiff <= p1Range && eloDiff <= p2Range) {
              queue.splice(j, 1);
              queue.splice(i, 1);
              i--; 
              
              const resolvedTopic = p1.topic !== 'All' ? p1.topic : p2.topic;
              await createActiveMatch(p1, p2, resolvedTopic, io);
              break; 
           }
        }
      }
    }, 2000);
  }

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    console.log(`User connected: ${socket.id} (User ID: ${userId || 'Unauthenticated'})`);
    io.emit('online_count', io.engine.clientsCount);

    if (userId && disconnectTimers[userId]) {
      clearTimeout(disconnectTimers[userId]);
      delete disconnectTimers[userId];
      
      for (const [roomId, room] of Object.entries(activeRooms)) {
        if (room.player1.userId === userId) {
          room.player1.socketId = socket.id;
          socket.join(roomId); 
          socket.to(roomId).emit('battle_alert', { message: 'Opponent reconnected!', type: 'success' });
        } else if (room.player2.userId === userId) {
          room.player2.socketId = socket.id;
          socket.join(roomId);
          socket.to(roomId).emit('battle_alert', { message: 'Opponent reconnected!', type: 'success' });
        }
      }
    }

    socket.on('join_room', (roomId) => { 
      socket.join(roomId); 
      const room = activeRooms[roomId];
      if (room) {
        if (room.isFinished) return;

        socket.emit('match_state', {
          problemIds: room.problemIds,
          startTime: room.startTime || Date.now(), 
          duration: room.duration || 1800 
        });
      } else {
        socket.emit('match_error', 'Invalid or expired match room.');
      }
    });

    // === NEW: Silently save their code to RAM whenever they Run/Submit ===
    socket.on('sync_code', ({ roomId, problemId, code }) => {
      const room = activeRooms[roomId];
      if (room && !room.isFinished) {
        const targetPlayer = room.player1.socketId === socket.id ? room.player1 : room.player2;
        if (!targetPlayer.codes) targetPlayer.codes = {};
        targetPlayer.codes[problemId] = code;
      }
    });

    socket.on('problem_solved', ({ roomId, problemTitle }) => {
      const room = activeRooms[roomId];
      if (room) {
        const isPlayer1 = room.player1.socketId === socket.id;
        const pointsEarned = room.problemsMap[problemTitle] || 100; 

        if (isPlayer1) {
          room.player1.solved += 1;
          room.player1.score += pointsEarned; 
          room.player1.lastSolveTime = Date.now();
        } else {
          room.player2.solved += 1;
          room.player2.score += pointsEarned; 
          room.player2.lastSolveTime = Date.now();
        }
      }

      socket.to(roomId).emit('battle_alert', {
        message: `⚠️ WARNING: Your opponent just secured "${problemTitle}"!`,
        type: 'danger'
      });
    });

    socket.on('send_chat', ({ roomId, message, senderName }) => {
      const now = Date.now();
      
      const cleanMessage = xss(message);
      const cleanSender = xss(senderName);
      if (!cleanMessage.trim()) return;

      if (!chatRateLimits[socket.id]) chatRateLimits[socket.id] = [];
      chatRateLimits[socket.id] = chatRateLimits[socket.id].filter(time => now - time < 5000);
      
      if (chatRateLimits[socket.id].length >= 3) {
        socket.emit('battle_alert', { 
          message: '⚠️ Transmission blocked: Slow down! (Max 3 messages / 5s)', 
          type: 'danger' 
        });
        return; 
      }
      
      chatRateLimits[socket.id].push(now);
      socket.to(roomId).emit('receive_chat', { message: cleanMessage, senderName: cleanSender, type: 'chat-opponent' });
    });

    // === NEW: PRIVATE DUEL EVENTS ===
    socket.on('create_private_duel', async ({ userId, questionCount, topic }) => {
      try {
        const user = await User.findById(userId);
        if (!user) return;
        
        const duelId = Math.random().toString(36).substring(2, 8).toUpperCase(); 
        
        // This is where the magic happens: Storing the host's choices!
        privateDuels[duelId] = {
          host: { 
            socketId: socket.id, 
            userId, 
            eloRating: user.eloRating, 
            questionCount, // Grabs the frontend state
            topic          // Grabs the frontend state
          },
          createdAt: Date.now()
        };
        
        socket.emit('private_duel_created', { duelId });
      } catch (error) {
        console.error("Duel creation failed:", error);
      }
    });

    socket.on('join_private_duel', async ({ duelId, userId }) => {
      try {
        const code = duelId.trim().toUpperCase();
        const duel = privateDuels[code];
        
        if (!duel) {
          socket.emit('match_error', 'Invalid or expired Duel Code.');
          return;
        }
        if (duel.host.userId === userId) {
          socket.emit('match_error', 'You cannot duel yourself!');
          return;
        }

        const host = duel.host;
        const guest = { socketId: socket.id, userId, questionCount: host.questionCount }; // Inherit host settings
        
        delete privateDuels[code]; // Remove from waiting list
        await createActiveMatch(host, guest, host.topic, io, { isPrivate: true });
      } catch (error) {
        console.error("Duel join failed:", error);
      }
    });

    socket.on('cancel_private_duel', ({ duelId }) => {
      if (privateDuels[duelId]) {
        delete privateDuels[duelId];
        console.log(`Private duel ${duelId} cancelled by host.`);
      }
    });

    socket.on('join_queue', async (preferences) => {
      try {
        const user = await User.findById(preferences.userId);
        if (!user) return;

        for (const room of Object.values(activeRooms)) {
          if (room.player1.userId === user._id.toString() || room.player2.userId === user._id.toString()) {
            socket.emit('match_error', 'You are already in an active battle! Check your other tabs.');
            return;
          }
        }

        queue = queue.filter(u => u.userId !== preferences.userId);
        
        queue.push({
          socketId: socket.id,
          userId: preferences.userId,
          eloRating: user.eloRating,
          questionCount: preferences.questionCount,
          topic: preferences.topic,
          joinTime: Date.now()
        });
        
      } catch (error) {
        console.error("Failed to join queue:", error);
      }
    });

    socket.on('leave_queue', () => { queue = queue.filter(user => user.socketId !== socket.id); });

    socket.on('match_won', async (data) => {
      const { roomId } = data;
      const room = activeRooms[roomId];
      if (!room || room.isProcessing) return; 
      room.isProcessing = true;

      const isPlayer1Winner = room.player1.socketId === socket.id;
      const winner = isPlayer1Winner ? room.player1 : room.player2;
      const loser = isPlayer1Winner ? room.player2 : room.player1;

      await recordMatchResults(winner, loser, roomId, io);
    });

    socket.on('forfeit_match', async ({ roomId }) => {
      const room = activeRooms[roomId];
      if (!room || room.isProcessing) return; 
      room.isProcessing = true;

      const isPlayer1Loser = room.player1.socketId === socket.id;
      const loser = isPlayer1Loser ? room.player1 : room.player2;
      const winner = isPlayer1Loser ? room.player2 : room.player1;

      await recordMatchResults(winner, loser, roomId, io, { isForfeit: true });
    });

    socket.on('match_timeout', async ({ roomId }) => {
      const room = activeRooms[roomId];
      if (!room || room.isProcessing) return; 
      room.isProcessing = true; 

      const p1 = room.player1;
      const p2 = room.player2;

      if (p1.solved === 0 && p2.solved === 0) {
        await recordMatchResults(null, null, roomId, io, { isDraw: true, reason: 'Time is up! Neither player solved a problem.' });
        return;
      }

      let winner, loser, reason;
      
      if (p1.score > p2.score) {
        winner = p1; loser = p2; reason = `Time is up! They secured higher difficulty algorithms (${p1.score} to ${p2.score} pts).`;
      } else if (p2.score > p1.score) {
        winner = p2; loser = p1; reason = `Time is up! They secured higher difficulty algorithms (${p2.score} to ${p1.score} pts).`;
      } 
      else {
        if (p1.lastSolveTime < p2.lastSolveTime) {
          winner = p1; loser = p2; reason = `Time is up! Scores tied at ${p1.score} pts, but they submitted faster!`;
        } else {
          winner = p2; loser = p1; reason = `Time is up! Scores tied at ${p2.score} pts, but they submitted faster!`;
        }
      }

      await recordMatchResults(winner, loser, roomId, io, { isTimeoutWin: true, reason });
    });

    socket.on('disconnect', () => {
      queue = queue.filter(user => user.socketId !== socket.id);
      delete chatRateLimits[socket.id];

      if (!userId) return; 

      let targetRoomId = null;
      let room = null;

      for (const [roomId, roomData] of Object.entries(activeRooms)) {
        if (roomData.player1.socketId === socket.id || roomData.player2.socketId === socket.id) {
          targetRoomId = roomId;
          room = roomData;
          break;
        }
      }

      if (room) {
        socket.to(targetRoomId).emit('battle_alert', { 
          message: '⚠️ Opponent disconnected! Waiting 60s for reconnection...', 
          type: 'danger' 
        });

        disconnectTimers[userId] = setTimeout(async () => {
          const currentRoom = activeRooms[targetRoomId];
          if (!currentRoom || currentRoom.isProcessing) return;
          currentRoom.isProcessing = true;

          const isPlayer1Loser = currentRoom.player1.userId === userId;
          const loser = isPlayer1Loser ? currentRoom.player1 : currentRoom.player2;
          const winner = isPlayer1Loser ? currentRoom.player2 : currentRoom.player1;

          await recordMatchResults(winner, loser, targetRoomId, io, { isForfeit: true });
          delete disconnectTimers[userId];
        }, 60000); 
      }
      io.emit('online_count', io.engine.clientsCount);
    });
  });
};