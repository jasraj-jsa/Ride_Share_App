/*                    MASTER: All the db/write operations will be performed here!                       */

var amqp = require("amqplib/callback_api");
var mongoose = require("mongoose");
const csv = require("csv-parser");
const fs = require("fs");
const Users = require("./models/users");
const Rides = require("./models/rides");

var zookeeper = require("node-zookeeper-client"); /* Connection to zkserver */
var client = zookeeper.createClient(
  "localhost:2181"
); /* Client for creating znodes */

mongoose.connect("mongodb://db_service:27017/master").then((db) => {
  console.log("\t\t\tCorrectly connected to the server!!");
});
/* Watch function for master election */
// var master_change = (event) => {
//   if(!event)
//   return;
//   console.log("Got event " + event);
//   if(event.getType() == 3){

//   }
// };

/* Once connection to client is made */
// client
//   .once("connected")
//   .then(() => {
//     console.log("Zookeeper is connected!");
//     return getId();
//   })
//   .then((id) => {
//     if (!id) {
//       console.log("First containerize this!");
//       process.exit(1);
//     }
//   });

amqp.connect("amqp://rabbitmq", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    var exchange = "orchestrate";
    channel.assertExchange(exchange, "direct", {
      durable: false,
    });
    channel.prefetch(1);
    /*Creating a writeQ to recieve all the write requests from orchestrator */
    channel.assertQueue(
      "writeQ",
      {},
      function (error, q) {
        if (error) {
          throw error;
        }
        console.log(" [*] Waiting for any writeQ requests!");
        /*Binding with routing_key=writeQ */
        channel.bindQueue(q.queue, exchange, "writeQ");
        /*Recieving the write requests from orchestrator */
        channel.consume(
          q.queue,
          function (msg) {
            console.log(
              " [x] %s: '%s'",
              msg.fields.routingKey,
              msg.content.toString()
            );
            processWriteRequests(JSON.parse(msg.content), (response) => {
              console.log("Request for writeQ");
              console.log(response);
              channel.publish(
                exchange,
                "syncQ",
                Buffer.from(JSON.stringify(JSON.parse(msg.content)))
              );
            });
            /*Manipulate the message if required and send it to syncQ to make the changes to other worker's databases*/
          },
          {
            noAck: true,
          }
        );
      },
      { durable: true }
    );
  });
});

/* Processing of requests by db/write */
var processWriteRequests = (requestmessage, callback) => {
  var res = { statusCode: "", send: "" };
  var operation = requestmessage.operation;
  if (operation == "clear") {
    Users.remove({}, function (err) {
      Rides.remove({}, function (err) {
        console.log("DB Cleared!");
        res.send = "";
        return callback(res);
      });
    });
  }
  var table = requestmessage.table;
  if (operation == "add") {
    var uname = requestmessage.username;
    var pwd = requestmessage.password;

    if (table.toLowerCase() == "users") {
      Users.create({ username: uname, password: pwd }).then((user) => {
        res.statusCode = "201";
        res.send = "";
        return callback(res);
      });
    } else {
      var cb = requestmessage.created_by;
      var time = requestmessage.timestamp;
      var s = requestmessage.source;
      var d = requestmessage.destination;
      Rides.find({}).then((rides) => {
        var Id;
        var us = [];
        if (rides.length == 0) {
          Id = 123;
        } else {
          var ma = 0;
          for (var key in rides) {
            if (rides[key].rideId > ma) {
              ma = rides[key].rideId;
            }
          }
          Id = ma + 1;
        }
        us.push(cb);
        Rides.create({
          created_by: cb,
          timestamp: time,
          source: s,
          destination: d,
          rideId: Id,
          users: us,
        }).then((ride) => {
          res.statusCode = "201";
          res.send = "";
          return callback(res);
        });
      });
    }
  } else if (operation == "join") {
    var id = requestmessage.rideId;
    var uname = requestmessage.username;
    Rides.find({ rideId: id }).then((rides) => {
      if (rides[0].users.includes(uname)) {
        res.statusCode = "201";
        res.send = "";
        return callback(res);
      } else {
        Rides.findByIdAndUpdate(
          rides[0]._id,
          { $push: { users: uname } },
          { new: true },
          (err, r) => {
            if (err) console.log(err);
            res.statusCode = "201";
            res.send = "";
            return callback(res);
          }
        );
      }
    });
  } else {
    if (table.toLowerCase() == "users") {
      Users.remove({ username: req.body.username }).then(() => {
        res.statusCode = "200";
        return callback(res);
      });
    } else {
      if (requestmessage.rideId.length == 0) {
        res.statusCode = "400";
        return callback(res);
      } else {
        Rides.remove({ rideId: requestmessage.rideId }).then(() => {
          res.statusCode = "200";
          res.send = "";
          return callback(res);
        });
      }
    }
  }
};
