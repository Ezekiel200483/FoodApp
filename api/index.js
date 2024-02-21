import fs from "node:fs/promises";
import process from "node:process";

import bodyParser from "body-parser";
import express from "express";
import { join } from "node:path";

const app = express();
app.set("port", process.env.PORT || 3054);
app.use(bodyParser.json());
app.use(express.static("public"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api/meals", async (req, res) => {
  // try-catch block is probably better here
  try {
    const mealsFilePath = join(process.cwd(), 'data', 'available-meals.json');
    const meals = await fs.readFile(
      mealsFilePath,
      "utf8"
    );
    res.json(JSON.parse(meals));
  } catch (err) {
    console.log(`server error: ${err}`);
  }
});


app.post("/api/orders", async (req, res) => {
  const orderData = req.body.order;

  if (
    orderData === null ||
    orderData.items === null ||
    orderData.items.length === 0
  ) {
    return res.status(400).json({ message: "Missing data." });
  }

  if (
    orderData.customer.email === null ||
    !orderData.customer.email.includes("@") ||
    orderData.customer.name === null ||
    orderData.customer.name.trim() === "" ||
    orderData.customer.street === null ||
    orderData.customer.street.trim() === "" ||
    orderData.customer["postal-code"] === null ||
    orderData.customer["postal-code"].trim() === "" ||
    orderData.customer.city === null ||
    orderData.customer.city.trim() === ""
  ) {
    return res.status(400).json({
      message:
        "Missing data: Email, name, street, postal code or city is missing.",
    });
  }

  try {
    const newOrder = {
      ...orderData,
      id: (Math.random() * 1000).toString(),
    };
    const ordersFilePath = join(process.cwd(), 'data', 'orders.json');
    const orders = await fs.readFile(ordersFilePath, "utf8");
    const allOrders = JSON.parse(orders);
    allOrders.push(newOrder);
    await fs.writeFile(ordersFilePath, JSON.stringify(allOrders));
    res.status(201).json({ message: "Order created!" });
  } catch (err) {
    console.log(`Server error: ${err}`);
  }
});


app.use((req, res) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  res.status(404).json({ message: "Not found" });
});

app.listen(app.get("port"), () => {
  console.log("Server is running on port", app.get("port"));
});

export default app
