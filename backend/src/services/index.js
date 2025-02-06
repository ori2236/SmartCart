import db from "../db/index.js"

export default {
  users: {
    create: (user) => {
      db.users.create(user);
    },
  },
  carts: {
    create: (cart) => {
      db.carts.create(cart);
    },
  },
};