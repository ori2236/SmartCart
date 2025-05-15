import axios from "axios";
import config from "../../config.js"

export default {
  get: {
    validator: async (req, res, next) => {
      const { input } = req.query;
      if (!input) {
        return res.status(400).json({
          error: "input is required.",
        });
      }

      next();
    },
    handler: async (req, res) => {
      const { input } = req.query;
      try {
        const googleRes = await axios.get(
          "https://maps.googleapis.com/maps/api/place/autocomplete/json",
          {
            params: {
              input,
              key: config.GOOGLE_MAPS_API_KEY,
              language: "iw",
              components: "country:il",
            },
          }
        );
        res.json(googleRes.data);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Autocomplete failed" });
      }
    },
  },
};
