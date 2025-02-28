import fetch from "node-fetch";
import * as cheerio from "cheerio";
import SupermarketImage from "../../models/SupermarketImage.js";

// List of supermarket names
const supermarkets = [
  "שופרסל",
  "מיני סופר אלונית",
  "אושר עד",
  "סטופמרקט",
  "מחסני השוק בשבילך",
  "מחסני להב",
  "שוויצריה הקטנה",
  "שופרסל שלי",
  "שופרסל דיל אקסטרה",
  "Carrefour hyper (קרפור היפר)",
  "נתיב החסד",
  "yellow",
  "ויקטורי",
  "קשת טעמים",
  "יוחננוף",
  "פוליצר",
];

// Function to fetch the logo URL from Wikipedia
async function getWikipediaLogo(storeName) {
  const wikipediaBaseUrl = "https://he.wikipedia.org/wiki/";
  const storeUrl =
    wikipediaBaseUrl + encodeURIComponent(storeName.replace(" ", "_"));

  try {
    const response = await fetch(storeUrl);
    if (!response.ok) throw new Error(`Error loading page: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    const logoImg = $("table.infobox img").first();
    if (logoImg.length > 0) {
      return "https:" + logoImg.attr("src");
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      `Error accessing Wikipedia for ${storeName}: ${error.message}`
    );
    return null;
  }
}

// Function to download the image and convert it to Base64
async function downloadImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok)
      throw new Error(`Error downloading image: ${response.status}`);

    const imageBuffer = await response.buffer();
    const base64Image = `data:image/png;base64,${imageBuffer.toString(
      "base64"
    )}`;

    return base64Image;
  } catch (error) {
    console.error(`Error downloading and converting image: ${error.message}`);
    return null;
  }
}

// Function to save the supermarket data to the database
async function postLogoToDB(storeName, base64Image) {
  try {
    // Check if the supermarket already exists in the DB
    const existingImage = await SupermarketImage.findOne({ name: storeName });

    if (existingImage) {
      console.log(
        `${storeName} already exists in the database. Skipping insert.`
      );
      return existingImage;
    }

    // If not found, insert a new entry
    const newImage = await SupermarketImage.create({
      name: storeName,
      image: base64Image,
    });
    console.log(`Inserted ${storeName} into the database.`);
    return newImage;
  } catch (error) {
    console.error(
      `Error inserting ${storeName} into database: ${error.message}`
    );
    return null;
  }
}

// Function to process request
async function processSupermarkets(req, res) {
  const { name, image } = req.body;

  // If 'name' and 'image' are provided, process them directly
  if (name && image) {
    console.log(`Received custom image for: ${name}`);
    const base64Image = await downloadImageAsBase64(image);

    if (!base64Image) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid image URL" });
    }

    const savedData = await postLogoToDB(name, base64Image);
    return res.json({
      success: true,
      message: "Image added successfully",
      savedData,
    });
  }

  // Otherwise, process all supermarkets from Wikipedia
  const missingLogos = [];
  const processedData = [];

  for (const store of supermarkets) {
    console.log(`Fetching logo for: ${store}...`);
    const logoUrl = await getWikipediaLogo(store);

    if (logoUrl) {
      console.log(`Logo found for ${store}: ${logoUrl}`);

      const base64Image = await downloadImageAsBase64(logoUrl);

      if (base64Image) {
        const savedData = await postLogoToDB(store, base64Image);
        processedData.push({ store, savedData });
      } else {
        missingLogos.push(store);
      }
    } else {
      console.warn(`No logo found for: ${store}`);
      missingLogos.push(store);
    }
  }

  return res.json({
    success: true,
    message: "Processing complete",
    processedData,
    missingLogos,
  });
}

export default processSupermarkets;
