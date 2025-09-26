const mongoose = require("mongoose");
const validator = require("validator");

const UserSchema = new mongoose.Schema({

email:{
        type: String,
    required: true,
    unique: true,            
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => validator.isEmail(v),
      message: "Invalid email address",

    }, 
},

passwordHash:{
    type: String,
    required: true,
},
 }, { timestamps: true });

 // Hide sensitive fields when returning JSON
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("User", UserSchema);