export const generateYears = (startYear: number) => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];

  for (let year = startYear; year <= currentYear; year++) {
    years.push(`${year}-${year + 1}`);
  }

  return years;
};

export const generateCohorts = (startYear: number) => {
  const currentYear = new Date().getFullYear();
  const cohorts: string[] = [];
  for (let year = startYear; year <= currentYear; year++) {
    cohorts.push(`${year + 1}`);
  }
  return cohorts;
};
