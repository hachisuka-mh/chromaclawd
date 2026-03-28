global.chrome = {
  storage: {
    sync: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
    },
    onChanged: { addListener: () => {} },
  },
  runtime: {
    onInstalled: { addListener: () => {} },
    onMessage: { addListener: () => {} },
  },
  contextMenus: {
    create: () => {},
    removeAll: (cb) => { if (cb) cb(); },
    update: () => {},
    onClicked: { addListener: () => {} },
  },
  tabs: {
    sendMessage: () => Promise.resolve({}),
    onActivated: { addListener: () => {} },
    onUpdated: { addListener: () => {} },
  },
};
