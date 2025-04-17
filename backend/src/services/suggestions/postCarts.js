import mongoose from "mongoose";
import { connectDB } from "../../db/index.js";
import Cart from "../../models/Cart.js";

const addresses = [
  "דיזנגוף 99, תל אביב",
  "בן יהודה 10, תל אביב",
  "הרצל 45, ראשון לציון",
  "שדרות רוטשילד 37, תל אביב",
  "דרך יצחק רבין 2, פתח תקווה",
  "שדרות הנשיא 134, חיפה",
  "יהודה הלוי 21, תל אביב",
  "ארלוזורוב 15, רמת גן",
  "שדרות ירושלים 102, יפו",
  "ויצמן 20, כפר סבא",
  "דרך חברון 101, ירושלים",
  "שדרות בן גוריון 41, חיפה",
  "אבן גבירול 52, תל אביב",
  "ז'בוטינסקי 160, בני ברק",
  "שדרות מנחם בגין 144, תל אביב",
  "יהושע בן נון 6, רמת גן",
  'רמב"ם 5, פתח תקווה',
  "יגאל אלון 94, תל אביב",
  "חיים עוזר 7, פתח תקווה",
  "דרך שלמה 39, תל אביב",
];

const createCarts = async () => {
  await connectDB();

  const cartPromises = addresses.map((address, index) => {
    return Cart.create({
      name: `עגלה${index + 1}`,
      address,
    });
  });

  const carts = await Promise.all(cartPromises);

  carts.forEach((cart) => {
    console.log(`Name: ${cart.name}, cartKey: ${cart._id}`);
  });

  mongoose.disconnect();
};

createCarts();
