const TMDB_BASE_URL = "https://api.themoviedb.org/3";

module.exports = async function handler(req, res) {
  const { path } = req.query;
  if (!path) {
    res.status(400).json({ error: "Missing path parameter" });
    return;
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "TMDB_API_KEY is not configured" });
    return;
  }

  const query = { ...req.query };
  delete query.path;

  const queryString = new URLSearchParams({ api_key: apiKey, language: "en-US", ...query }).toString();
  const url = `${TMDB_BASE_URL}${path}?${queryString}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json(data);
      return;
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
