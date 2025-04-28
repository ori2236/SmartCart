import mongoose from "mongoose";
import { connectDB } from "../../db/index.js";
import Cart from "../../models/Cart.js";

const addresses = [
  "הנביאים 12, ירושלים",
  "אבן גבירול 170, תל אביב",
  "הגליל 5, נהריה",
  "רוטשילד 100, ראשון לציון",
  "החשמונאים 96, תל אביב",
  "שדרות ההסתדרות 200, חיפה",
  "אלנבי 50, תל אביב",
  "הירקון 121, תל אביב",
  "מעלה יצחק 8, נתניה",
  "אוסישקין 44, רמת השרון",
  "דרך הים 5, חיפה",
  "ז'בוטינסקי 33, פתח תקווה",
  "הברוש 12, מודיעין",
  "העלייה 15, חיפה",
  "שלמה המלך 37, כפר סבא",
  "חנקין 8, חולון",
  "העצמאות 65, אשדוד",
  "הזית 9, כרמיאל",
  "יצחק שדה 6, תל אביב",
  "הברוש 22, רחובות",
  "בלפור 10, בת ים",
  "סוקולוב 92, הרצליה",
  "התעשייה 11, חולון",
  "החרושת 8, נתניה",
  "דרך רבין 7, קריית מוצקין",
  "יוסף 8, נתניה",
  "דרך בן גוריון 1, רמת גן",
  "החשמל 14, תל אביב",
  "שדרות משה סנה 17, ירושלים",
];

const createCarts = async () => {
  await connectDB();

  const cartPromises = addresses.map((address, index) => {
    return Cart.create({
      name: `עגלה${index + 22}`,
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
