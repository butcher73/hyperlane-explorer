// Inspired by https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
export function getHumanReadableTimeString(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds <= 2) {
    return 'Just now';
  }
  if (seconds <= 60) {
    return `${seconds} seconds ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes <= 1) {
    return '1 minute ago';
  }
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours <= 1) {
    return '1 hour ago';
  }
  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}