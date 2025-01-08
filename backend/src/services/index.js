import assignments from "../controllers/assignments";
import carts from "../controllers/carts/index.js";
import subjects from "../controllers/subjects/index.js";
import users from "../controllers/users/index.js";

import db from "../db/index.js"

export default {
  assignments: {
    create: (assignment) => {
      db.assignments.create(assignment);
    },
  },
  subjects: {
    create: (subject) => {
      db.subjects.create(subject);
    },
  },
  users: {
    create: (user) => {
      db.subjects.create(user);
    },
  },
  carts: {
    create: (cart) => {
      db.subjects.create(cart);
    },
  },
};