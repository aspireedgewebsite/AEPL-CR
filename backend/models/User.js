const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = [
  "super_admin",
  "manager",       // admin-1
  "asst_manager",  // admin-2
  "team_lead",
  "employee",
  "operation",
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ROLES, required: true },
    // Direct supervisor in the hierarchy tree:
    // manager -> asst_manager -> team_lead -> employee
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    teamName: { type: String, trim: true, default: "" },
    monthlyTarget: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
