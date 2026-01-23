const toLocalDateStringFromDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toLocalDateString = (value: Date | string) => {
  if (value instanceof Date) {
    return toLocalDateStringFromDate(value);
  }

  const dateOnly = value.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }

  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return '';
  }

  return toLocalDateStringFromDate(parsed);
};
