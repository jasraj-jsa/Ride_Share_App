const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const countSchema = new Schema({
    countId: {
        type: Number
    },
    counter: {
        type: Number
    }
});

var Counts = mongoose.model("Count", countSchema);

module.exports = Counts;
