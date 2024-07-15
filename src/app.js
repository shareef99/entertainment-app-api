const express = require("express");
const app = express();
const userModel = require("./models/users");
const z = require("zod");
const bcrypt = require("bcrypt");
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("/", (_, res) => {
  res.json("Entertainment App API created by Nadeem Shareef");
});

/**
 * @swagger
 * '/api/users':
 *  get:
 *     tags:
 *     - Users
 *     summary: Get all users
 *     responses:
 *      200:
 *        description: Fetched Successfully
 *      400:
 *        description: Bad Request
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.get("/api/users", async (_, res) => {
  try {
    const users = await userModel.find().select("-__v -password -bookmarks");

    res.status(200).json(users);
  } catch (err) {
    res.status(400).json({
      message: "Invalid name Url",
    });
  }
});

/**
 * @swagger
 * '/api/signup':
 *  post:
 *     tags:
 *     - Signup
 *     description: Signup the user with email and password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              password:
 *                type: string
 *     summary: Signup the user with email and password
 *     responses:
 *      200:
 *        description: Signup Successful
 *      400:
 *        description: Bad Request
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.post("/api/signup", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1, "required"),
    });
    const payload = req.body;
    const parseResult = schema.safeParse(payload);

    if (!parseResult.success) {
      return res
        .status(400)
        .json(
          parseResult.error.errors
            .map((e) => `${e.path} ${e.message}`)
            .join(" , ")
        );
    }

    const user = await userModel.findOne({ email: parseResult.data.email });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    bcrypt.hash(parseResult.data.password, 10, async function (error, hash) {
      if (error) {
        return res.status(500).json({ message: error.message });
      }

      const createdUser = await userModel.create({
        email: parseResult.data.email,
        password: hash,
        bookmarks: [],
      });

      return res
        .status(200)
        .json({ message: "User created", userId: createdUser._id });
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * '/api/login':
 *  post:
 *     tags:
 *     - Login
 *     description: Login the user with email and password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              password:
 *                type: string
 *     summary: Login the user with email and password
 *     responses:
 *      200:
 *        description: Login Successful
 *      400:
 *        description: Bad Request
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.post("/api/login", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1, "required"),
    });
    const payload = req.body;
    const parseResult = schema.safeParse(payload);

    if (!parseResult.success) {
      return res
        .status(400)
        .json(
          parseResult.error.errors
            .map((e) => `${e.path} ${e.message}`)
            .join(" , ")
        );
    }

    const user = await userModel.findOne({ email: parseResult.data.email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(
      parseResult.data.password,
      user.password
    );

    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    return res.status(200).json({
      message: "Login successful",
      user: { id: user._id, email: user.email, bookmarks: user.bookmarks },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * '/api/bookmark':
 *  put:
 *     tags:
 *     - Bookmark
 *     description: Update the user bookmarks
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              bookmarks:
 *                type: array
 *     summary: Update the user bookmarks
 *     responses:
 *      200:
 *        description: Updated Successfully
 *      400:
 *        description: Bad Request
 *      404:
 *        description: Not Found
 *      500:
 *        description: Server Error
 */
app.put("/api/bookmark", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload) {
      return res.status(400).json({ message: "Missing payload" });
    }

    const user = await userModel.findOne({ email: payload.email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const updatedUser = await userModel.updateOne(
      { email: payload.email },
      { $set: { bookmarks: payload.bookmarks } }
    );

    return res.status(200).json({ message: "Updated Successfully" });
  } catch (err) {
    console.log("Error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = app;
