import util from "util";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../../models/Product.js"
import InvalidProduct from "../../models/InvalidProduct.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = util.promisify(exec);

const runScript = async (scriptPath, args = []) => {
  const command = `python "${scriptPath}" ${args
    .map((arg) => `"${arg}"`)
    .join(" ")}`;
  const { stdout, stderr } = await execPromise(command);
  if (stderr) throw new Error(stderr.trim());
  return stdout.trim();
};

const isValidImage = (base64) => {
  return (
    typeof base64 === "string" &&
    base64.startsWith("data:image/") &&
    base64.length > 100
  );
};

const getProducts = async (req, res) => {
  const term = req.query.term;
  const shopping_address = req.query.shopping_address;

  const searchProductsScriptPath = path.resolve(__dirname, "searchProducts.py");
  const productImageScriptPath = path.resolve(__dirname, "productImage.py");

  try {
    const productsJson = await runScript(searchProductsScriptPath, [
      term,
      shopping_address,
    ]);
    const products = JSON.parse(productsJson);

    const updatedProducts = (
      await Promise.all(
        products.map(async (product) => {
          try {
            const existingProduct = await Product.findOne({
              name: product.label,
            });

            if (existingProduct && isValidImage(existingProduct.image)) {
              return { ...product, image: existingProduct.image };
            }

            const existingInvalidProduct = await InvalidProduct.findOne({
              name: product.label,
            });

            if (existingInvalidProduct) {
              return null;;
            }
            
            const productImageResultJson = await runScript(
              productImageScriptPath,
              [shopping_address, product.label]
            );
            const imageResult = JSON.parse(productImageResultJson);

            if (isValidImage(imageResult.image)) {
              await Product.create({
                name: product.label,
                image: imageResult.image,
              });

              return { ...product, image: imageResult.image };
            } else {
              await InvalidProduct.create({
                name: product.label,
                image: imageResult.image,
              });

              return null;
            }
          } catch (error) {
            console.error("Error for product:", product.label, error.message);
            return null;
          }
        })
      )
    ).filter(Boolean);

    const uniqueProductsMap = new Map();
    updatedProducts.forEach((product) => {
      if (!uniqueProductsMap.has(product.label)) {
        uniqueProductsMap.set(product.label, product);
      }
    });

    res.status(200).json(Array.from(uniqueProductsMap.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export default getProducts;
