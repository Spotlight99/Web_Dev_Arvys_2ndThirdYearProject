const Storage = {
  saveFavorites(favorites) {
    try {
      localStorage.setItem("spotextv_favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Failed to save favorites", error);
    }
  },

  getFavorites() {
    try {
      const data = localStorage.getItem("spotextv_favorites");
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load favorites", error);
      return [];
    }
  },

  saveRecentSearches(searches) {
    try {
      localStorage.setItem("spotextv_recent_searches", JSON.stringify(searches));
    } catch (error) {
      console.error("Failed to save recent searches", error);
    }
  },

  getRecentSearches() {
    try {
      const data = localStorage.getItem("spotextv_recent_searches");
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load recent searches", error);
      return [];
    }
  },

  saveTheme(theme) {
    try {
      localStorage.setItem("spotextv_theme", theme);
    } catch (error) {
      console.error("Failed to save theme", error);
    }
  },

  getTheme() {
    try {
      return localStorage.getItem("spotextv_theme");
    } catch (error) {
      console.error("Failed to load theme", error);
      return null;
    }
  }
};

export default Storage;
