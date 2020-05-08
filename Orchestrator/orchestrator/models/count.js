const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CountSchema = new Schema({
  cid: { type: Number },
  counter: { type: Number, default: 0 },
});

var Counts = mongoose.model("Count", CountSchema);

module.exports = Counts;
