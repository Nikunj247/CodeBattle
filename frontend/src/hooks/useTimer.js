import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialSeconds = 1800) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState(null);

  // Standard practice timer
  const startTimer = useCallback(() => {
    setEndTime(Date.now() + timeLeft * 1000);
    setIsActive(true);
  }, [timeLeft]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    setEndTime(null);
  }, []);

  const setCustomTime = useCallback((seconds) => {
    setTimeLeft(seconds);
    setIsActive(false);
  }, []);

  // Synchronized Ranked Timer
  const startSyncTimer = useCallback((serverStartTime, durationSeconds) => {
    const exactEndTime = serverStartTime + (durationSeconds * 1000);
    setEndTime(exactEndTime);
    setIsActive(true);
  }, []);

  // The engine that calculates absolute time remaining
  useEffect(() => {
    let interval = null;
    if (isActive && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const difference = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(difference);

        if (difference <= 0) {
          setIsActive(false);
          clearInterval(interval);
        }
      }, 200); 
    }
    return () => clearInterval(interval);
  }, [isActive, endTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return { formattedTime, timeLeft, startTimer, stopTimer, setCustomTime, startSyncTimer, isActive };
}