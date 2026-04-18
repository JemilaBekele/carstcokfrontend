const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export const tokenService = {
  get() {
    if (typeof window === "undefined") {
      return null;
    }

    return {
      accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    };
  },

  set(tokens: Tokens) {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },

  clear() {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
