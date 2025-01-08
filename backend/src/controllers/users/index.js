import User from "../../models/User.js";

export default {
  post: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      const name = req.body.name;
      const mail = req.body.mail;
      const password = req.body.password;
      const is_Google = req.body.is_Google;

      try {
        console.log("Inserting user:", { name, mail, password, is_Google });
        const newUser = await User.create({
          name,
          mail,
          password,
          is_Google,
        });
        console.log("User inserted:", newUser);

        res.json({
          message: "inserted",
          user: newUser,
        });
      } catch (error) {
        console.error("Error inserting user:", error.message);
        res.status(500).json({
          message: "Error inserting user",
          error: error.message,
        });
      }
    },
  },
  get: {
    validator: async (req, res, next) => {
      //check that the mail is valid
      //check that the passward is valid
      console.log("user");
      next();
    },
    handler: async (req, res) => {
      const mail = req.params.id;

      try {
        const user = await User.findOne({ mail });
        if (!user) {
          return res.status(404).json({
            message: "User not found",
          });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({
          message: "Error fetching user",
          error: error.message,
        });
      }
    },

    validator: async (req, res, next) => {
      //check that the mail is valid
      //check that the passward is valid
      console.log("user");
      next();
    },
    handler: async (req, res) => {
      const mail = req.params.id;

      try {
        const user = await User.findOne({ mail });
        if (!user) {
          return res.status(404).json({
            message: "User not found",
          });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({
          message: "Error fetching user",
          error: error.message,
        });
      }
    },
  },
  put: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      const mail = req.params.id;
      const name = req.body.name;
      const password = req.body.password;
      const is_Google = req.body.is_Google;

      try {
        const updatedUser = await User.findOneAndUpdate(
          { mail },
          { name, mail, password, is_Google },
          { new: true, runValidators: true }
        );

        if (!updatedUser) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        res.json({
          message: "updated",
          user: updatedUser,
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
      const mail = req.params.id;

      try {
        const deletedUser = await User.findByIdAndDelete(mail);

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
      // אין צורך בוולידציה עבור פעולה זו
      next();
    },
    handler: async (req, res) => {
      try {
        // שליפת כל המשתמשים מהדאטאבייס
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
