const LS_PREFIX = '@@agentsmith';

export const LOCAL_STORAGE_KEYS = {
  PLACEHOLDER: 'PLACEHOLDER',
} as const;

export type LocalStorageKeys = keyof typeof LOCAL_STORAGE_KEYS;

export const setLocalStorageItem = (key: string, value: string) => {
  localStorage.setItem(`${LS_PREFIX}_${key}`, value);
};

export const getLocalStorageItem = (key: string) => {
  return localStorage.getItem(`${LS_PREFIX}_${key}`);
};

export const removeLocalStorageItem = (key: string) => {
  localStorage.removeItem(`${LS_PREFIX}_${key}`);
};
