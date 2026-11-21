const noop = () => {};

export const AppEventsLogger = {
  logEvent: noop,
  logPurchase: noop,
  setUserID: noop,
  AppEvents: {},
  AppEventParams: {},
};

export const Settings = {
  initializeSDK: noop,
  setAppID: noop,
  setAdvertiserTrackingEnabled: async () => {},
};

export default {};