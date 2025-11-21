export const cacheUtils = {
  invalidateServices: (ownerId: string = '1') => {
    localStorage.removeItem(`services_${ownerId}`);
    localStorage.removeItem(`services_${ownerId}_time`);
  },

  invalidateSettings: (ownerId: string = '1') => {
    localStorage.removeItem(`settings_${ownerId}`);
    localStorage.removeItem(`settings_${ownerId}_time`);
  },

  invalidateAll: (ownerId: string = '1') => {
    cacheUtils.invalidateServices(ownerId);
    cacheUtils.invalidateSettings(ownerId);
  },

  clearAll: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('services_') || key.startsWith('settings_')) {
        localStorage.removeItem(key);
      }
    });
  }
};
