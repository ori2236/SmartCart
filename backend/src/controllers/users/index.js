import bcrypt from "bcrypt";
import User from "../../models/User.js";
import VerificationCode from "../../models/VerificationCode.js";
import nodemailer from "nodemailer";

const SALT_ROUNDS = 10;

//6 digits code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationEmail = async (mail, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"SmartCart" <smartcartbi@gmail.com>',
    to: mail,
    subject: "Verification Code for SmartCart",
    text: `Your verification code is: ${code}`,
  };

  await transporter.sendMail(mailOptions);
};


export default {
  register: {
    validator: async (req, res, next) => {
      let { mail, password, nickname } = req.body;
      mail = mail.toLowerCase();
      if (!mail || !password || !nickname) {
        return res
          .status(400)
          .json({ error: "mail, password and nickname are required" });
      }
      const existingUser = await User.findOne({ mail });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      /*
        (?=.*[a-z]) - lowercase
        (?=.*[A-Z]) - uppercase
        (?=.*\d) - number
        (?=.*[@$!%*?&]) - special char
        [A-Za-z\d@$!%*?&]{8,} - at least 8 characters from any of these
      */
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({
          error: "weak password",
        });
      }

      next();
    },
    handler: async (req, res) => {
      let { mail, password, nickname } = req.body;
      mail = mail.toLowerCase();

      try {
        const verificationCode = generateVerificationCode();

        await VerificationCode.deleteOne({ mail });
        await sendVerificationEmail(mail, verificationCode);

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await VerificationCode.create({
          mail,
          code: verificationCode,
          hashedPassword,
          nickname,
        });

        res.json({
          message: "Verification code sent to email",
        });
      } catch (error) {
        console.error("Error sending email:", error.message);
        res.status(500).json({
          message: "Error sending verification email",
          error: error.message,
        });
      }
    },
  },
  verifyCode: {
    validator: async (req, res, next) => {
      const { mail, code, explanation } = req.body;
      if (!mail || !code || !explanation) {
        return res
          .status(400)
          .json({ error: "mail, code, and explanation are required" });
      }
      next();
    },
    handler: async (req, res) => {
      let { mail, code, explanation } = req.body;
      mail = mail.toLowerCase();
      try {
        const verificationEntry = await VerificationCode.findOne({ mail });
        if (!verificationEntry || verificationEntry.code !== Number(code)) {
          return res.status(400).json({ error: "Invalid verification code" });
        }
        await VerificationCode.deleteOne({ mail });
        if (explanation === "register") {
          const newUser = await User.create({
            mail,
            password: verificationEntry.hashedPassword,
            nickname: verificationEntry.nickname,
          });

          return res.status(200).json({
            message: "User verified and created successfully",
            userMail: mail,
            nickname: newUser.nickname,
          });
        } else {
          res.json({
            message: "User verified",
            userMail: mail,
          });
        }
      } catch (error) {
        res.status(500).json({
          message: "Error verifying code",
          error: error.message,
        });
      }
    },
  },
  login: {
    validator: async (req, res, next) => {
      const { mail, password } = req.body;

      if (!mail || !password) {
        return res
          .status(400)
          .json({ error: "mail and password are required" });
      }

      next();
    },
    handler: async (req, res) => {
      let { mail, password } = req.body;
      mail = mail.toLowerCase();

      try {
        const user = await User.findOne({ mail });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return res
            .status(200)
            .json({
              message: "Login successful",
              userMail: user.mail,
              nickname: user.nickname,
            });
        }
        return res.status(401).json({ error: "Invalid password" });
      } catch (error) {
        res.status(500).json({
          message: "Error logging in",
          error: error.message,
        });
      }
    },
  },
  sendCode: {
    validator: async (req, res, next) => {
      let { mail } = req.body;
      mail = mail.toLowerCase();
      if (!mail) {
        return res.status(400).json({ error: "mail is required" });
      }
      const existingUser = await User.findOne({ mail });
      if (!existingUser) {
        return res.status(404).json({ error: "Email not exists" });
      }

      next();
    },
    handler: async (req, res) => {
      let { mail, password } = req.body;
      mail = mail.toLowerCase();

      try {
        const verificationCode = generateVerificationCode();

        await VerificationCode.deleteOne({ mail });
        await sendVerificationEmail(mail, verificationCode);

        await VerificationCode.create({
          mail,
          code: verificationCode,
          hashedPassword: "---",
          nickname: "---"
        });

        res.json({
          message: "Verification code sent to email",
        });
      } catch (error) {
        console.error("Error sending email:", error.message);
        res.status(500).json({
          message: "Error sending verification email",
          error: error.message,
        });
      }
    },
  },
  get: {
    validator: async (req, res, next) => {
      let mail = req.params.mail;
      mail = mail.toLowerCase();

      if (!mail) {
        return res.status(400).json({ error: "mail is required" });
      }

      next();
    },
    handler: async (req, res) => {
      let mail = req.params.mail;
      mail = mail.toLowerCase();

      try {
        const existingUser = await User.findOne({ mail });
        if (!existingUser) {
          return res.status(404).json({ error: "Email not exists" });
        }
        return res.status(200).json({
          message: "Email exists",
          user: mail,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error finding user",
          error: error.message,
        });
      }
    },
  },
  replacePassword: {
    validator: async (req, res, next) => {
      let { mail, password } = req.body;
      mail = mail.toLowerCase();
      if (!mail || !password) {
        return res
          .status(400)
          .json({ error: "mail and password are required" });
      }
      const existingUser = await User.findOne({ mail });
      if (!existingUser) {
        return res.status(400).json({ error: "Email not exists" });
      }

      /*
        (?=.*[a-z]) - lowercase
        (?=.*[A-Z]) - uppercase
        (?=.*\d) - number
        (?=.*[@$!%*?&]) - special char
        [A-Za-z\d@$!%*?&]{8,} - at least 8 characters from any of these
      */
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({
          error: "weak password",
        });
      }

      next();
    },
    handler: async (req, res) => {
      let { mail, password } = req.body;
      mail = mail.toLowerCase();

      try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const updatedUser = await User.findOneAndUpdate(
          { mail },
          { password: hashedPassword },
          { new: true, runValidators: true }
        );


        if (!updatedUser) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        return res.status(200).json({
          message: "password replaced",
          userMail: updatedUser.mail,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error updating user",
          error: error.message,
        });
      }
    },
  },
  delete: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      let { mail } = req.params;
      mail = mail.toLowerCase();
      try {
        const deletedUser = await User.findOneAndDelete({ mail: mail });
        if (!deletedUser) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        res.json({
          message: "deleted",
        });
      } catch (error) {
        res.status(500).json({
          message: "Error deleting user",
          error: error.message,
        });
      }
    },
  },
  deleteAll: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      try {
        await User.deleteMany();

        res.json({
          message: "deleted all",
        });
      } catch (error) {
        res.status(500).json({
          message: "Error deleting all users",
          error: error.message,
        });
      }
    },
  },
  getAll: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      try {
        const users = await User.find({});
        res.json({
          message: "Fetched all users",
          users,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error fetching users",
          error: error.message,
        });
      }
    },
  },
};
