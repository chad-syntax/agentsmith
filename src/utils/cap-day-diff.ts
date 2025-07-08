export const capDayDiff = (
  startDate: Date,
  endDate: Date,
  maxDays: number = 90,
): { startDate: Date; endDate: Date } => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > maxDays) {
    // Cap the end date to 90 days from start date for filters
    const cappedEndDate = new Date(startDate);
    cappedEndDate.setDate(startDate.getDate() + maxDays);
    return { startDate, endDate: cappedEndDate };
  }

  return { startDate, endDate };
};
