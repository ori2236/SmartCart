import util from "util";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

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

    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        try {
          const productImageResultJson = await runScript(
            productImageScriptPath,
            [shopping_address, product.label]
          );
          const imageResult = JSON.parse(productImageResultJson);

          return { ...product, image: imageResult.image };
        } catch (error) {
          return { ...product, image: "error" };
        }
      })
    );

    res.status(200).json(updatedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export default getProducts;
