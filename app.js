require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("./model/user");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Welcome to Auth System");
});

app.post("/register", async (req, res) => {
  try {
    //collect all information
    const { firstname, lastname, email, password } = req.body;

    //validate the data
    if (!(firstname && lastname && email && password)) {
      res.status(401).send("All field are required");
    }

    //check if user exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(401).send("User already exist");
    }

    //encrypt password
    const encryptPassword = await bcrypt.hash(password, 10);

    //create a new entry in database
    const user = await User.create({
      firstname,
      lastname,
      email,
      password: encryptPassword,
    });

    //create a token and send it to user
    const token = jwt.sign(
      {
        id: user._id,
        email,
      },
      "shhhhh",
      { expiresIn: "2h" }
    );
    user.token = token;
    //don't want to send password
    user.password = undefined;

    res.status(401).json(user);
  } catch (error) {
    console.log(error);
    console.log("Error in Reponse Route");
  }
});

app.post("/login", async (req, res) => {
  try {
    // collect information in fronend
    const { email, password } = req.body;
    // validate
    if (!(email, password)) {
      res.status(401).send("All field are reqiuired");
    }
    // check user in db
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).send("You need to register first");
    }
    // match the password & create token and send
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id, email }, "shhhhh", {
        expiresIn: "2h",
      });
      user.password = undefined;
      user.token = token;

      const options = {
        expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      };

      res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        user,
      });
    } else {
      res.status(401).send("Email id & Password are incorrect");
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/Dashboard", auth, (req, res) => {
  res.send("Welcome to Dashboard");
});

module.exports = app;
