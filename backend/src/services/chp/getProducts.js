import axios from "axios";
import Product from "../../models/Product.js";
import InvalidProduct from "../../models/InvalidProduct.js";
import Favorite from "../../models/Favorite.js";
import ProductInCart from "../../models/ProductInCart.js";

const cleanAddress = (address) => {
  address = address.trim();
  if (address.endsWith("ישראל")) {
    address = address
      .slice(0, -"ישראל".length)
      .trim()
      .replace(/,+$/, "")
      .trim();
  }
  return address.replace(/,+$/, "").trim();
};

//if the image is a valid base64 image
const isValidImage = (base64) => {
  return (
    typeof base64 === "string" &&
    base64.startsWith("data:image/") &&
    base64.length > 100
  );
};

//fetch products suggestions from CHP
const fetchProductSuggestions = async (term, shoppingAddress) => {
  const url = "https://chp.co.il/autocompletion/product_extended";

  const response = await axios.get(url, {
    params: { term, shopping_address: shoppingAddress },
    headers: {
      "User-Agent": "",
    },
  });

  if (response.status !== 200) {
    throw new Error(`Request failed with status code: ${response.status}`);
  }

  const results = response.data || [];
  const products = results
    .filter(
      (product) => product.label && product.label !== "↓ הצג ערכים נוספים ↓"
    )
    .map((product) => ({ label: product.label }));

  return products;
};

//fetch product image from CHP
const fetchProductImage = async (location, productName) => {
  const encodedProductName = encodeURIComponent(productName);
  const url = `https://chp.co.il/${location}/0/0/${encodedProductName}`;

  const headers = {
    "User-Agent": "",
  };

  const response = await axios.get(url, {
    headers,
  });

  if (response.status !== 200) {
    throw new Error(`failed to fetch image`);
  }

  const match = response.data.match(/data-uri="([^"]+)"/);

  //match to the regex
  if (match && match[1]) {
    return match[1];
  } else {
    throw new Error(`image not found`);
  }
};

const getProducts = async (req, res) => {
  const term = req.query.term;
  const address = req.query.shopping_address;
  const shoppingAddress = cleanAddress(address);
  try {
    //fetch products names from CHP
    const products = await fetchProductSuggestions(term, shoppingAddress);

    const [existingProducts, existingInvalidProducts, favorites, cartProducts] =
      await Promise.all([
        Product.find({ name: { $in: products.map((p) => p.label) } }).select(
          "name image"
        ),
        InvalidProduct.find({
          name: { $in: products.map((p) => p.label) },
        }).select("name"),
        Favorite.find({ mail: req.query.userMail }),
        ProductInCart.find({ cartKey: req.query.cartKey }),
      ]);

    //products is in the database
    const existingProductMap = new Map(
      existingProducts.map((p) => [p.name, p])
    );

    //invalid products is in the database
    const invalidProductMap = new Map(
      existingInvalidProducts.map((p) => [p.name, p])
    );

    const favoriteMap = new Map(favorites.map((fav) => [fav.productId, fav]));
    const cartProductMap = new Map(cartProducts.map((p) => [p.productId, p]));

    const invalidProductsToInsert = [];

    //filter products and fetch images
    const updatedProducts = (
      await Promise.all(
        products.map(async (product) => {
          try {
            const existingProduct = existingProductMap.get(product.label);
            const existingInvalidProduct = invalidProductMap.get(product.label);

            if (existingInvalidProduct) {
              return null;
            }

            //exist in the database
            if (existingProduct && isValidImage(existingProduct.image)) {
              return {
                ...product,
                image: existingProduct.image,
                _id: existingProduct._id.toString(),
              };
            }

            //fetch image
            let imageBase64 = null;
            try {
              imageBase64 = await fetchProductImage(
                shoppingAddress,
                product.label
              );
            } catch {
              invalidProductsToInsert.push({
                name: product.label,
                image: imageBase64,
              });
            }

            if (isValidImage(imageBase64)) {
              const createdProduct = await Product.create({
                name: product.label,
                image: imageBase64,
              });

              return {
                ...product,
                image: createdProduct.image,
                _id: createdProduct._id.toString(),
              };
            } else {
              invalidProductsToInsert.push({
                name: product.label,
                image: imageBase64,
              });

              return null;
            }
          } catch (error) {
            console.error(
              `Error fetching or processing product: ${product.label}`,
              error.message
            );
            return null;
          }
        })
      )
    ).filter(Boolean);

    //update the database with invalid products
    if (invalidProductsToInsert.length > 0) {
      await InvalidProduct.insertMany(invalidProductsToInsert, {
        ordered: false,
      });
    }

    //unique product list
    const uniqueProductsMap = new Map();
    updatedProducts.forEach((product) => {
      if (!uniqueProductsMap.has(product.label)) {
        uniqueProductsMap.set(product.label, product);
      }
    });

    const response = updatedProducts.map((product) => {
      const productId = product._id || product._id?.toString();
      const favorite = favoriteMap.get(productId);
      const cartProduct = cartProductMap.get(productId);

      return {
        productId,
        label: product.label,
        image: product.image,
        isFavorite: !!favorite,
        isInCart: !!cartProduct,
        quantityInCart: cartProduct?.quantity || 0,
        quantityInFavorite: favorite?.quantity || 0,
      };
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export default getProducts;
