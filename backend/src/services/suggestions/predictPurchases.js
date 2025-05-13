import Weights from "../../models/Weights.js";
import mongoose from "mongoose";
import TrainingExample from "../../models/TrainingExample.js";
import { connectDB } from "../../db/index.js";

//sigmoid function, number to 0-1 range
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

//calculate to prediction by the weights
function predictProbability(X, weights) {
  const z = X.reduce((sum, x_i, i) => sum + x_i * weights[i], 0);
  return sigmoid(z);
}

//gradient descent
function trainLogisticRegression(
  data,
  labels,
  learningRate = 0.01,
  iterations = 1000
) {
  const numSamples = data.length;
  const numFeatures = data[0].length;

  let weights = new Array(numFeatures).fill(0); //all the weights are 0

  for (let k = 0; k < iterations; k++) {
    const gradients = new Array(numFeatures).fill(0);

    for (let i = 0; i < numSamples; i++) {
      const prediction = predictProbability(data[i], weights);
      const error = prediction - labels[i];

      //update the gradient
      for (let j = 0; j < numFeatures; j++) {
        gradients[j] += error * data[i][j];
      }
    }

    //update the weights
    for (let j = 0; j < numFeatures; j++) {
      weights[j] -= (learningRate / numSamples) * gradients[j];
    }
  }

  return weights;
}

async function trainModel() {
  const examples = await TrainingExample.find().lean();
  if (examples.length === 0) throw new Error("no training examples found");
  
  const X = examples.map((e) => e.features);
  const y = examples.map((e) => e.label);

  //train the model with the example
  const trainedWeights = trainLogisticRegression(X, y);

  const featureNames = [
    "bias",
    "isFavorite",
    "purchasedBefore",
    "timesPurchased",
    "recentlyPurchased",
    "storeCount",
    "timesWasRejectedByUser",
    "timesWasRejectedByCart",
  ];

  await Promise.all(
    featureNames.map(async (name, i) => {
      await Weights.findOneAndUpdate(
        { featureName: name },
        { weight: trainedWeights[i], updatedAt: new Date() },
        { upsert: true }
      );
    })
  );

  return trainedWeights;
}

//update the model by single example
async function updateWeights(x, y, learningRate = 0.01) {
  const weights = await Weights.find().sort({ featureName: 1 }).lean();
  const w = weights.map((wi) => wi.weight);
  const featureNames = weights.map((wi) => wi.featureName);

  const p = predictProbability(x, w);

  //gradient
  const error = p - y;
  const newW = w.map((wi, i) => wi - learningRate * error * x[i]);
  const now = new Date(); 
  const updates = featureNames.map((name, i) => ({
    featureName: name,
    weight: newW[i],
    updatedAt: now,
  }));

  await Weights.deleteMany({});
  await Weights.insertMany(updates);
}


//sort the products by the chances they will be purchased by the user in the cart
async function rankProducts(productFeatureMap) {
  const weights = await Weights.find().lean();
  if (weights.length === 0) throw new Error("weights not found");

  const featuresNames = weights.map((wi) => wi.featureName);
  const w = weights.map((wi) => wi.weight);

  const ranked = [];

  for (const [productId, data] of productFeatureMap.entries()) {
    const featureVector = [1]; //bias
    for (const featureName of featuresNames.slice(1)) {
      featureVector.push(data[featureName] ?? 0);
    }

    //predict if the product will be purchased
    const prob = predictProbability(featureVector, w);
    ranked.push({ productId, probability: prob });
  }

  //sorting by predictions
  ranked.sort((a, b) => b.probability - a.probability);
  return ranked;
}

//train the model
async function main() {
  try {
    await connectDB();
    await trainModel();
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
}

export { trainModel, rankProducts, updateWeights };
