const pad2 = (value) => String(value).padStart(2, "0");

const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// UI display format used across the application: DD-MM-YYYY
export const formatDateDMY = (value) => {
  const date = toValidDate(value);
  if (!date) return "";

  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
};

// Keep the visible time friendly while preserving the local SQL time.
export const formatTime12 = (value, includeSeconds = true) => {
  const date = toValidDate(value);
  if (!date) return "";

  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const period = hours24 >= 12 ? "PM" : "AM";

  return `${pad2(hours12)}:${minutes}${includeSeconds ? `:${seconds}` : ""} ${period}`;
};

export const formatDateTimeDMY = (value, includeSeconds = true) => {
  const date = toValidDate(value);
  if (!date) return "-";
  return `${formatDateDMY(date)}, ${formatTime12(date, includeSeconds)}`;
};

// HTML date inputs need YYYY-MM-DD internally. Use local getters instead of
// toISOString() so the selected/default day is not shifted by UTC conversion.
export const formatDateInputValue = (value = new Date()) => {
  const date = toValidDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};
