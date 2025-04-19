import CartHistory from "../../../models/CartHistory.js";
import HotProduct from "../../../models/HotProduct.js";

export async function trendingProducts(cartProductIds, k) {
  const hotProducts = await HotProduct.find();

  //if exist in database
  if (hotProducts.length > 0) {
    //checking if there is hot products in the database from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdDate = new Date(hotProducts[0].createdAt);
    createdDate.setHours(0, 0, 0, 0);

    //check if the dates are the same
    if (createdDate.getTime() === today.getTime()) {
      return hotProducts.map(({ productId, score }) => ({
        productId,
        score,
      }));
    } else {
      await HotProduct.deleteMany({});
    }
  }

  const now = new Date();
  const week1 = new Date(now);
  week1.setDate(now.getDate() - 7);

  const week2 = new Date(now);
  week2.setDate(now.getDate() - 14);

  const week3 = new Date(now);
  week3.setDate(now.getDate() - 21);

  const trending = await CartHistory.aggregate([
    {
      $match: {
        date: { $gte: week3 }, // past 3 week
      },
    },
    {
      $project: {//the fields that will be in the output
        productId: 1, 
        weight: {
          $switch: {
            branches: [
              {
                case: { $gte: ["$date", week1] },
                then: 1,
              },
              {
                case: {
                  $and: [{ $gte: ["$date", week2] }, { $lt: ["$date", week1] }],
                },
                then: 0.8,
              },
              {
                case: {
                  $and: [{ $gte: ["$date", week3] }, { $lt: ["$date", week2] }],
                },
                then: 0.5,
              },
            ],
            default: 0,
          },
        },
      },
    },
    {
      $group: {
        _id: "$productId",
        score: { $sum: "$weight" }, // sum of the scores
      },
    },
    {
      $sort: { score: -1 }, //top to bottom
    },
    {
      $limit: k, //best k products
    },
  ]);

  const productIds = trending.map((item) => item._id);

  const toInsert = trending.map(({ _id, score }) => {
    const id = _id.toString();
    return {
      productId: id,
      score,
    };
  });

  await HotProduct.insertMany(
    toInsert.map((r) => ({
      ...r,
      createdAt: new Date(),
    }))
  );

  const finalResults = toInsert.filter(
    ({ productId }) => !cartProductIds.includes(productId)
  );

  return finalResults;
}

export default trendingProducts;
