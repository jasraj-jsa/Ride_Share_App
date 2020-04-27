const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RideSchema = new Schema({
    rideId: {
        type: Number
    },
    source: {
        type: Schema.Types.Mixed
    },
    destination: {
        type: Schema.Types.Mixed
    },
    created_by: {
        type: Schema.Types.Mixed
    },
    timestamp: {
        type: Schema.Types.Mixed
    },
    users: {
        type: Array
    }

});


var Rides = mongoose.model("Ride", RideSchema);

module.exports = Rides;
