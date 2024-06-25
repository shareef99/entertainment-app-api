const app = require("./app.js");
const mongoose = require("mongoose");
const port = 9000;
const swaggerDocs = require("./swagger");
require("dotenv").config();

// Connect to DATABASE
const DATABASE_URL = process.env.MONGO_DB_URL;
mongoose
  .connect(DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => swaggerDocs(app));
const db = mongoose.connection;
db.on("error", (err) => console.log(err));
db.once("open", () => console.log("connected to database"));

// Start Server
app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
