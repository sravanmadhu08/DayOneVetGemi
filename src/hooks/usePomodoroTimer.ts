import { useCallback, useEffect, useState } from 'react';

export type TimerMode = 'work' | 'break';

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const STORAGE_KEY = 'pomodoro_timer_state';

interface StoredPomodoroTimerState {
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  endAt: number | null;
}

const getDuration = (mode: TimerMode) => (mode === 'work' ? WORK_SECONDS : BREAK_SECONDS);

const getInitialState = (): StoredPomodoroTimerState => {
  if (typeof window === 'undefined') {
    return {
      mode: 'work',
      timeLeft: WORK_SECONDS,
      isActive: false,
      endAt: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        mode: 'work',
        timeLeft: WORK_SECONDS,
        isActive: false,
        endAt: null,
      };
    }

    const parsed = JSON.parse(raw) as Partial<StoredPomodoroTimerState>;
    const mode = parsed.mode === 'break' ? 'break' : 'work';
    const endAt = typeof parsed.endAt === 'number' ? parsed.endAt : null;
    const storedTimeLeft =
      typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0
        ? Math.min(parsed.timeLeft, getDuration(mode))
        : getDuration(mode);

    if (parsed.isActive && endAt) {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      return {
        mode,
        timeLeft: remaining,
        isActive: remaining > 0,
        endAt: remaining > 0 ? endAt : null,
      };
    }

    return {
      mode,
      timeLeft: storedTimeLeft,
      isActive: false,
      endAt: null,
    };
  } catch {
    return {
      mode: 'work',
      timeLeft: WORK_SECONDS,
      isActive: false,
      endAt: null,
    };
  }
};

export function usePomodoroTimer() {
  const [initialState] = useState(getInitialState);
  const [mode, setMode] = useState<TimerMode>(initialState.mode);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isActive, setIsActive] = useState(initialState.isActive);
  const [endAt, setEndAt] = useState<number | null>(initialState.endAt);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsActive(false);
    setEndAt(null);
  }, []);

  useEffect(() => {
    if (!isActive || !endAt) return;

    const updateTimeLeft = () => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        if ("Notification" in window && Notification.permission === 'granted') {
          new Notification(mode === 'work' ? 'Time for a break!' : 'Back to work!');
        }
        switchMode(mode === 'work' ? 'break' : 'work');
      }
    };

    updateTimeLeft();
    const interval: ReturnType<typeof setInterval> = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endAt, isActive, mode, switchMode]);

  useEffect(() => {
    const state: StoredPomodoroTimerState = {
      mode,
      timeLeft,
      isActive,
      endAt,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [endAt, isActive, mode, timeLeft]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const toggleTimer = useCallback(() => {
    if (isActive) {
      const remaining = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : timeLeft;
      setTimeLeft(remaining);
      setIsActive(false);
      setEndAt(null);
      return;
    }

    setEndAt(Date.now() + timeLeft * 1000);
    setIsActive(true);
  }, [endAt, isActive, timeLeft]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setEndAt(null);
    setTimeLeft(getDuration(mode));
  }, [mode]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    mode,
    timeLeft,
    isActive,
    toggleTimer,
    resetTimer,
    switchMode,
    formatTime,
  };
}
