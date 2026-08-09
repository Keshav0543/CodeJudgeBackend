import User from "../models/user.js";
import validate from "../utils/validator.js";
import Submission from "../models/Submission.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import client from "../config/redis.js";
import transporter from "../config/transPorter.js";
import crypto from "crypto";

const register = async (req, res) => {
  try {
    //Validate the data
    validate(req.body);
    const { firstName, emailId, password } = req.body;
    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = "user";

    const user = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: "user" },
      process.env.SECRET_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    res.status(200).json({
      result: reply,
      message: "Registered Successfully...",
    });
  } catch (err) {
    console.log("Register Error:", err);
    res.status(400).send("Error: " + err.message);
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId) throw new Error("Invalid credentials");
    if (!password) throw new Error("Invalid credentials");

    const user = await User.findOne({ emailId });

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid credentials");

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    res.status(200).json({
      result: reply,
      message: "Login Successfully...",
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const getProfile = async (req, res) => {
  try {
    res.status(200).send(req.result);
  } catch (err) {
    res.status(401).send("Error: " + err.message);
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    const payload = jwt.decode(token);

    await client.set(`token:${token}`, `Blocked`);
    await client.expireAt(`token:${token}`, payload.exp);
    res.clearCookie("token");
    res.status(200).send("User LoggedOut...");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const admin = async (req, res) => {
  try {
    //Validate the data
    validate(req.body);
    const { firstName, emailId, password } = req.body;
    req.body.password = await bcrypt.hash(password, 10);

    const user = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: 60 * 60 },
    );
    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
    res.status(201).send("user Registered Sucessfully...");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const deleteProfile = async (req, res) => {
  try {
    const id = req.result._id;

    //User has Deleted...
    await User.findByIdAndDelete(id);
    //User Submission deletion...
    await Submission.deleteMany({ userId: id });
    res.status(200).send("User Deleted SuccessFully...");
  } catch (err) {
    res.status(500).send("Internal Server Error...");
  }
};

const authenticate = async (req, res) => {
  try {
    const reply = {
      emailId: req.result.emailId,
      firstName: req.result.firstName,
      _id: req.result._id,
      role: req.result.role,
    };

    res.status(200).json({
      result: reply,
      message: "User logged in...",
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

const ForgotPass = async (req, res) => {
  try {
    const emailId = req.body.emailId;
    if (!emailId) throw new Error("Enter Emailid For Process...");
    const result = await User.findOne({ emailId });
    if (!result) throw new Error("Enter Valid emailId...");
    const existingToken = await client.get(`emailId:${emailId}`);
    if (existingToken) {
      return res
        .status(429)
        .send("A reset link has already been sent. Please check your email.");
    }
    const token = crypto.randomBytes(32).toString("hex");
    const hashToken = await bcrypt.hash(token, 10);
    await client.set(`emailId:${emailId}`, `${hashToken}`, { EX: 20 * 60 });
    const resetUrl = `http://localhost:5173/reset-password?emailId=${encodeURIComponent(emailId)}&token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: emailId,
      subject: "Reset Your Password",
      html: `
    <h2>Password Reset</h2>
    <p>Click below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link expires in 20 minutes.</p>
  `,
    });
    res.status(200).send("Password reset link sent");
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
};

const ResetPass = async (req, res) => {
  try {
    const token = req.body.token;
    const password = req.body.password;
    const emailId = req.body.emailId;
    const key = `emailId:${emailId}`;
    const RedisToken = await client.get(key);
    if (!RedisToken) {
      return res.status(400).send("Reset link expired or invalid");
    }

    const result=await bcrypt.compare(token,RedisToken);
    if(!result)throw new Error("Malformed Token...");
    const NewhasPass=await bcrypt.hash(password,10);
    const data=await User.findOne({emailId});
    data.password=NewhasPass;
    await data.save();
    await client.del(key);
    res.status(200).send("Password Changed SuccessFully...");
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
};

export default {
  register,
  login,
  getProfile,
  logout,
  admin,
  deleteProfile,
  authenticate,
  ForgotPass,
  ResetPass,
};
