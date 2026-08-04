// Creates the first Super Admin account. Run once: npm run seed
require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");

const run = async () => {
  await connectDB();
  const email = "superadmin@odissitech.com";
  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Super admin already exists:", email);
    process.exit(0);
  }
  await User.create({
    name: "Odissitech Super Admin",
    email,
    password: "ChangeMe@123", // change this immediately after first login
    role: "super_admin",
    phone: "0000000000",
  });
  console.log("Super admin created:");
  console.log("  email:", email);
  console.log("  password: ChangeMe@123 (change after first login)");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
