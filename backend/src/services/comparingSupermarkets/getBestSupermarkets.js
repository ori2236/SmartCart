import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";
import ProductInCart from "../../models/ProductInCart.js";
import Product from "../../models/Product.js";
import SupermarketImage from "../../models/SupermarketImage.js"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// encode JSON to Base64
const encodeBase64 = (jsonObj) => {
  return Buffer.from(JSON.stringify(jsonObj), "utf-8").toString("base64");
};

export const runScript = async (scriptName, args = []) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, scriptName);
    const process = spawn("python", [scriptPath, ...args]);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        console.error("Python stderr:", stderr);
        return reject(
          new Error(stderr.trim() || `Process exited with code ${code}`)
        );
      }
      try {
        resolve(stdout.trim());
      } catch (error) {
        reject(error);
      }
    });
  });
};

const getBestSupermarkets = async (req, res) => {
  try {
    const { cartKey } = req.params;
    const { address, alpha = 0.5 } = req.body;

    if (!cartKey || !address) {
      return res.status(400).json({ error: "Missing cartKey or address" });
    }

    const productsInCart = await ProductInCart.find({ cartKey });
    const productDetails = await Product.find({
      _id: { $in: productsInCart.map((item) => item.productId) },
    });
    const products = productsInCart.map((item) => {
      const product = productDetails.find(
        (prod) => prod._id.toString() === item.productId.toString()
      );

      return {
        productId: item.productId,
        quantity: item.quantity,
        ...(product && {
          name: product.name,
          image: product.image,
        }),
      };
    });

    if (!Array.isArray(products)) {
      return res.status(200).json({
        supermarkets: [],
        recommendations: [],
        product_images: [],
      });
    }
    
    if (!products) {
      return res.status(404).json({ error: "the cart not found" });
    } else if (products.length === 0) {
      return res
        .status(200)
        .json({ message: "No products found in the cart." });
    }
    
    const product_images_list = products.map((item) => ({
      name: item.name,
      image: item.image,
    }));
    
    //convert to dictionary
    const cart = {};
    for (const item of products) {
      cart[item.name] = item.quantity;
    }
    const encodedCart = encodeBase64(cart);
    const pythonOutput = await runScript("bestBranches.py", [
      encodedCart,
      address,
      alpha.toString(),
    ]);

    // parse JSON response
    const { supermarkets, recommendations } = JSON.parse(pythonOutput);

    if (!supermarkets) {
      return res
        .status(400)
        .json({ error: "the supermarkets not found", recommendations });
    } else if (supermarkets.length === 0) {
      return res.status(200).json({
        supermarkets: [],
        recommendations,
        product_images: product_images_list,
      });
    }

    const supermarketNames = supermarkets.map((s) => s.Store);
    const supermarketImages = await SupermarketImage.find({
      name: { $in: supermarketNames },
    });

    const logoMap = {};
    supermarketImages.forEach(({ name, image }) => {
      logoMap[name] = image;
    });

    const supermarketsWithLogos = supermarkets.map((s) => ({
      ...s,
      logo: logoMap[s.Store] || null,
    }));
    
    res.status(200).json({
      supermarkets: supermarketsWithLogos,
      recommendations,
      product_images: product_images_list,
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};

export default getBestSupermarkets;