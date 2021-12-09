const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const stripe = require("stripe")(
  "sk_test_51K4oTFGArCfxeiQOzr5ZydUZ0uijIqBNfZz3l09AYsqPsSPsVgDGtEtS6gLtZNfkdlIArRmZeFWasf05GN5YlwjC00FC6e02t0"
);
// getting cors
const cors = require("cors");

// getting dotenv files
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());

// database info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hyits.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

// console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Mailchimp APi
const mc_api_key = process.env.MAIL_CHIMP_API_KEY;
const mc_audience_id = process.env.MAIL_CHIMP_LIST_ID;

const Mailchimp = require("mailchimp-api-v3");
const mailchimp = new Mailchimp(mc_api_key);

// All api callings start
async function run() {
  try {
    await client.connect();

    //   database name and collections
    const database = client.db("dji-a-12");

    // Products Collection
    const productsCollection = database.collection("products");

    // User Orders
    const userOrdersCollection = database.collection("userOrders");

    // Users Collection
    const usersCollection = database.collection("registeredUsers");

    // Review Collection
    const reviewCollection = database.collection("reviews");

    // Queries Collection
    const queriesCollection = database.collection("queries");

    //Posting user Orders / Creating  api
    app.post("/userOrders", async (req, res) => {
      const userOrders = req.body;
      const result = await userOrdersCollection.insertOne(userOrders);
      res.send(result);
    });

    // Saving user queries in database
    app.post("/queries", async (req, res) => {
      const userQueries = req.body;
      const result = await queriesCollection.insertOne(userQueries);
      res.json(result);
    });

    // mailchimp posting user mail
    app.post("/newsletter", async (req, res) => {
      console.log(req.body.email);
      mailchimp
        .post(`/lists/${mc_audience_id}/members`, {
          email_address: req.body.email,
          status: "subscribed",
        })
        .then((result) => {
          res.send(result);
        })
        .catch((err) => {
          res.send(err);
        });
    });
    // git pull origin main --allow-unrelated-histories

    //  Saving user reviews in database
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.json(result);
    });

    // Saving registered users in database / Create Api
    app.post("/users", async (req, res) => {
      const users = req.body;
      const result = await usersCollection.insertOne(users);
      res.json(result);
    });

    // Creating new Product / Create API
    app.post("/newProducts", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.json(result);
    });

    // Getting all Products / Reading all api
    app.get("/allProducts", async (req, res) => {
      const cursor = productsCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });

    // Getting specific product by id
    app.get("/productDetails/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      // console.log(query);
      res.json(result);
    });

    // Getting Filtered Products / Read filtered
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});

      const result = await cursor.limit(6).toArray();
      res.json(result);
    });

    // Getting all orders
    app.get("/orders", async (req, res) => {
      const cursor = userOrdersCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });

    // getting user orders
    app.get("/userOrders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = userOrdersCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    // user orders for payment
    app.get("/userorders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userOrdersCollection.findOne(query);
      res.json(result);
    });

    // getting all reviews
    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });

    // getting admin user list
    app.get("/admins", async (req, res) => {
      const query = { role: "admin" };
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    // getting if a user is admin or not
    app.get("/admins:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // Updating status of orders / Update Api
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const update = req.body;
      const updateDoc = {
        $set: {
          status: update.status,
        },
      };
      const result = await userOrdersCollection.updateOne(query, updateDoc);
      res.json(result);
    });

    // Updating role of admin / UPDATE Api
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
    // Deleting a Product / Delete Api
    app.delete("/allProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.json(result);
    });

    // Deleting user order
    app.delete("/userorders/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: ObjectId(id) };
      const result = await userOrdersCollection.deleteOne(query);
      res.json(result);
    });

    // payment
    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price * 100;
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });

    app.put("/userOrders/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const payment = req.body;
      const updateDoc = {
        $set: {
          paymnet: payment,
        },
      };
      const result = await userOrdersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

// testing initial server run
app.get("/", (req, res) => {
  res.send("a-12 server is running");
});

// listening if server running smoothly
app.listen(port, () => {
  console.log("server of a-12 is running at", port);
});
