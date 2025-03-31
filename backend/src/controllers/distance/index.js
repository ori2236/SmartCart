import Distance from "../../models/Distance.js";
import { runScript } from "../../services/comparingSupermarkets/getBestSupermarkets.js";
import { Buffer } from "buffer";

const encodeBase64 = (jsonObj) => {
  return Buffer.from(JSON.stringify(jsonObj), "utf-8").toString("base64");
};

export default {
  post: {
    validator: async (req, res, next) => {
      const { from, destinations } = req.body;
      if (!from || !Array.isArray(destinations) || destinations.length === 0) {
        return res
          .status(400)
          .json({ error: "orgin address and a list of destinations are required." });
      }
      next();
    },
    handler: async (req, res) => {
      const { from, destinations } = req.body;

      const existingDistances = await Distance.find({
        from: from,
        to: { $in: destinations },
      });

      const existingMap = new Map(
        existingDistances.map((d) => [d.to, d.distance])
      );

      const missingDestinations = destinations.filter(
        (dest) => !existingMap.has(dest)
      );

      let responseDistances = existingDistances.map((d) => ({
        from: d.from,
        to: d.to,
        distance: d.distance,
      }));

      if (missingDestinations.length > 0) {
        try {
          const encodedDestinations = encodeBase64(destinations);
          const pythonOutput = await runScript("distance_calculator.py", [
            from,
            encodedDestinations,
          ]);

          // parse JSON response
          if (!pythonOutput) {
            return res
              .status(500)
              .json({ error: "No response from Python script" });
          }

          const calculatedDistances = JSON.parse(pythonOutput);
          const distancesArray = calculatedDistances.distances;

          if (!distancesArray || !Array.isArray(distancesArray)) {
            return res.status(500).json({
              error: "Python output is missing required distances data",
            });
          }

          const newDistances = distancesArray.map((d) => ({
            from: from,
            to: d.Address,
            distance: d["Distance (km)"],
          }));

          // the "catch" is for the duplicates
          await Distance.insertMany(newDistances, { ordered: false }).catch(
            (err) => {}
          );

          const uniqueDistances = new Map();

          responseDistances.forEach((d) =>
            uniqueDistances.set(`${d.from}_${d.to}`, d)
          );

          newDistances.forEach((d) =>
            uniqueDistances.set(`${d.from}_${d.to}`, d)
          );

          responseDistances = Array.from(uniqueDistances.values());
        } catch (error) {
          return res
            .status(500)
            .json({
              error: "Failed to calculate distances.",
              details: error.message,
            });
        }
      }
      return res.status(200).json(responseDistances);
    },
  },
};
