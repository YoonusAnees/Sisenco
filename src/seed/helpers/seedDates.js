/**
 * Helper module for calculating consistent Monday-to-Sunday reporting week boundaries.
 */

/**
 * Calculates the start (Monday 00:00:00.000) and end (Sunday 23:59:59.999) of a week
 * offset by weekOffset weeks from the current week.
 *
 * @param {number} weekOffset - 0 for current week, -1 for previous week, -2 for 2 weeks ago, etc.
 * @returns {{ weekStart: Date, weekEnd: Date, weekStartStr: string }}
 */
export const getReportingWeek = (weekOffset = 0) => {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 1 is Monday, ...
  
  // Calculate distance to current week's Monday in UTC
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday + weekOffset * 7);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return {
    weekStart: monday,
    weekEnd: sunday,
    weekStartStr: monday.toISOString().slice(0, 10),
  };
};

/**
 * Returns pre-calculated date ranges for the target reporting weeks.
 */
export const getSeedWeekRanges = () => {
  return {
    threeWeeksAgo: getReportingWeek(-3),
    twoWeeksAgo: getReportingWeek(-2),
    previousWeek: getReportingWeek(-1),
    currentWeek: getReportingWeek(0),
  };
};
