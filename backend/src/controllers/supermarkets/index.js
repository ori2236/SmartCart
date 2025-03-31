import SupermarketImage from "../../models/SupermarketImage.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { name, image } = req.body;

      if (!name || !image) {
        return res.status(400).json({ error: "name and image are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { name, image } = req.body;

      try {
        const newImage = await SupermarketImage.create({ name, image });
        res.json({
          message: "inserted",
          image: newImage,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error inserting image",
          error: error.message,
        });
      }
    },
  },

  get: {
    validator: async (req, res, next) => {
      const { supermarkets } = req.body;

      if (
        !supermarkets ||
        !Array.isArray(supermarkets) ||
        supermarkets.length === 0
      ) {
        return res.status(400).json({
          error: "A non-empty array of supermarket names is required.",
        });
      }

      next();
    },
    handler: async (req, res) => {
      const { supermarkets } = req.body;

      try {
        const supermarketImages = await SupermarketImage.find({
          name: { $in: supermarkets },
        });

        if (!supermarketImages || supermarketImages.length === 0) {
          return res.status(404).json({
            message: "No logos found for the provided supermarkets",
          });
        }

        const logosMap = {};
        supermarketImages.forEach(({ name, image }) => {
          logosMap[name] = image;
        });

        res.json(logosMap);
      } catch (error) {
        res.status(500).json({
          message: "Error fetching images",
          error: error.message,
        });
      }
    },
  },
};
