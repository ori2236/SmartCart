import Coordinates from "../../models/Coordinates.js";
import { execFile } from "child_process";
import util from "util";
import path from "path";


const execFilePromise = util.promisify(execFile);

export default {
  get: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      const { addresses } = req.body;
      if (!Array.isArray(addresses)) {
        return res.status(400).json({ error: "Addresses must be an array." });
      }

      try {
        const coordinates = await Coordinates.find({
          Address: { $in: addresses },
        });
        const response = addresses.map((addr) => {
          const found = coordinates.find((coord) => coord.Address === addr);
          return found
            ? {
                Address: addr,
                Latitude: found.Latitude,
                Longitude: found.Longitude,
              }
            : { Address: addr, Latitude: null, Longitude: null };
        });

        res.status(200).json(response);
      } catch (error) {
        res.status(500).json({
          error: "Error retrieving coordinates.",
          details: error.message,
        });
      }
    },
  },
  coordinatesByProduct: {
    validator: async (req, res, next) => {
      const { productName, cartAddress } = req.body;
      if (!productName || !cartAddress) {
        return res
          .status(400)
          .json({ error: "productName and cartAddress are required." });
      }
      next();
    },

    handler: async (req, res) => {
      const { productName, cartAddress } = req.body;

      const pythonScriptPath = path.resolve(
        "./src/services/locations/findPlaces.py"
      );
      const env = {
        ...process.env,
        PYTHONPATH: path.resolve("./src"),
      };

      execFile(
        "python",
        [pythonScriptPath, productName, cartAddress],
        { env },
        async (error, stdout, stderr) => {
          if (error) {
            console.error("Error executing Python script:", stderr);
            return res.status(500).json({
              error: "Internal server error.",
              details: stderr,
            });
          }

          try {
            const output = stdout.trim();
            const firstChar = output.charAt(0);

            if (firstChar !== "{" && firstChar !== "[") {
              console.error("Python script did not return valid JSON:", output);
              return res.status(500).json({
                error: "Invalid response from Python script.",
                details: output,
              });
            }

            const validSupermarkets = JSON.parse(output);
            if (validSupermarkets.length === 0) {
              return res
                .status(200)
                .json({ message: "No valid supermarkets found." });
            }

            console.table(validSupermarkets);

            const addresses = validSupermarkets.map((s) => s.Address);
            const existingCoordinates = await Coordinates.find({
              Address: { $in: addresses },
            });

            const existingAddresses = existingCoordinates.map((e) => e.Address);

            const newCoordinates = validSupermarkets
              .filter((s) => !existingAddresses.includes(s.Address))
              .map((s) => ({
                Address: s.Address,
                Latitude: s.Coordinates[0],
                Longitude: s.Coordinates[1],
              }));

            if (newCoordinates.length > 0) {
              await Coordinates.insertMany(newCoordinates, { ordered: false });
              console.log(
                `Saved ${newCoordinates.length} new coordinates to the database.`
              );
            }

            return res.status(200).json(validSupermarkets);
          } catch (parseError) {
            console.error("Error parsing Python output:", parseError);
            return res.status(500).json({
              error: "Error parsing Python output.",
              details: parseError.message,
            });
          }
        }
      );
    },
  },
};