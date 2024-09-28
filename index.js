require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 2024;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Dress-Up");
    const collection = db.collection("users");
    const productCollection = db.collection("products");

    // CRUD operations for Product Collection

    // Get all products
    app.get("/api/v1/products", async (req, res) => {
      try {
        // Extracting query parameters for pagination, category, and sorting
        const { page = 1, category, sort } = req.query;
        const limit = 9; // 9 products per page
        const skip = (page - 1) * limit;

        // Building the query based on the category filter
        const query = {};
        if (category) {
          query.category = category;
        }

        // Sorting option based on the sort query ('asc' for ascending, 'desc' for descending price)
        const sortOption = sort === "asc" ? { price: 1 } : { price: -1 };

        // Fetching the filtered, sorted, and paginated products from the collection
        const products = await productCollection
          .find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .toArray();

        // Total number of products for pagination calculation
        const totalProducts = await productCollection.countDocuments(query);

        // Sending the response with products, pagination, and status
        res.json({
          success: true,
          message: "Products retrieved successfully",
          products,
          totalProducts,
          totalPages: Math.ceil(totalProducts / limit),
          currentPage: parseInt(page),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to get products",
          error,
        });
      }
    });

    // Get a single product by ID
    app.get("/api/v1/products/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const product = await productCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!product) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }
        res.json({
          success: true,
          message: "Product retrieved successfully",
          product,
        });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Failed to get product", error });
      }
    });

    // Create a new product
    app.post("/api/v1/products", async (req, res) => {
      const { image, title, price, ratings, category, description } = req.body;
      try {
        const newProduct = {
          image,
          title,
          price,
          ratings,
          category,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await productCollection.insertOne(newProduct);
        res.status(201).json({
          success: true,
          message: "Product created successfully",
          product: result.ops[0],
        });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Failed to create product", error });
      }
    });

    // Update a product by ID (PUT)
    app.put("/api/v1/products/:id", async (req, res) => {
      const { id } = req.params;
      const { image, title, price, ratings, category, description } = req.body;
      try {
        const updatedProduct = {
          $set: {
            image,
            title,
            price,
            ratings,
            category,
            description,
            updatedAt: new Date(),
          },
        };
        const result = await productCollection.updateOne(
          { _id: new ObjectId(id) },
          updatedProduct
        );
        if (result.matchedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, message: "Product updated successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Failed to update product", error });
      }
    });

    // Delete a product by ID
    app.delete("/api/v1/products/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await productCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, message: "Product deleted successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Failed to delete product", error });
      }
    });

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { username, email, password, imageUrl } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists!",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      const newUser = await collection.insertOne({
        username,
        email,
        password: hashedPassword,
        role: "user",
        imageUrl:
          imageUrl ||
          "https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png",
      });

      // Generate JWT token
      const token = jwt.sign(
        { email: newUser.email, role: "user" },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully!",
        accessToken: token,
        user: {
          username,
          email,
          role: "user",
          imageUrl: newUser.imageUrl,
        },
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "User successfully logged in!",
        accessToken: token,
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          imageUrl:
            user.imageUrl ||
            "https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png",
        },
      });
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
