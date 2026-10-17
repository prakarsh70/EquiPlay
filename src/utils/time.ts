/**
 * Format milliseconds / seconds into MM:SS or HH:MM:SS
 */
export function formatTimeRemaining(msRemaining: number): {
  formatted: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  if (msRemaining <= 0) {
    return { formatted: '00:00', isUrgent: true, isExpired: true };
  }

  const totalSeconds = Math.floor(msRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);

  let formatted = '';
  if (hours > 0) {
    const remMinutes = minutes % 60;
    formatted = `${hours}:${remMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Urgent when less than 10 minutes remaining
  const isUrgent = totalSeconds <= 600;

  return { formatted, isUrgent, isExpired: false };
}

/**
 * Format elapsed duration between start and end timestamps (or now)
 */
export function formatDuration(startTime?: number, endTime?: number): string {
  if (!startTime) return '00:00';
  const end = endTime || Date.now();
  const elapsedMs = Math.max(0, end - startTime);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format an arrival Unix timestamp to localized 12-hour time (e.g. 7:14 PM)
 */
export function formatArrivalTime(timestamp?: number): string {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

