import * as SecureStore from "expo-secure-store";

let apiServer = null;

const loadServerUrl = async () => {
  const stored = await SecureStore.getItemAsync("apiServer");
  apiServer = stored || null;
};

loadServerUrl();

export default {
  get apiServer() {
    return apiServer;
  },
  setApiServer: async (url) => {
    await SecureStore.setItemAsync("apiServer", url);
    apiServer = url;
  },
  loadServerUrl: () => {
    return loadServerUrl();
  },
};
