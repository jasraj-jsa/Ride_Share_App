const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: Schema.Types.Mixed
    },
    password: {
        type: Schema.Types.Mixed
    }
});

var Users = mongoose.model("User", UserSchema);

module.exports = Users;