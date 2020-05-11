var express = require("express");
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
var amqp = require("amqplib/callback_api");
var Docker = require("dockerode");
const Counts = require("../models/count");
var docker = new Docker();
var mongodb = require("mongodb").MongoClient;

/* New slave node */

function copyCollection(source, target, collectionName, cb) {
  source.collection(collectionName, function (err1, sourceCollection) {
    if (err1) {
      console.error("error opening source collection");
      cb(err1);
    } else {
      target.collection(collectionName, function (err2, targetCollection) {
        if (err2) {
          console.error("error opening target collection");
          cb(err2);
        } else {
          // Note: if this fails it's because I was lazy and used toArray
          // try .each() and insert one doc at a time? (do a count() first so you know it's done)
          sourceCollection.find().toArray(function (err3, results) {
            if (err3) {
              console.error("error finding source results");
              cb(err3);
            } else {
              targetCollection.insert(results, { safe: true }, function (
                err4,
                docs
              ) {
                if (err4) {
                  console.error("error inserting target results");
                  cb(err4);
                } else {
                  cb(null, docs.length + " docs inserted");
                }
              });
            }
          });
        }
      });
    }
  });
}
var newSlave = () => {
  mongodb.connect("mongodb://mongo:27017/master").then((dbm) => {
    console.log("\t\tMAster");
    mongodb.connect("mongodb://mongo:27017/slave").then((dbs) => {
      console.log("\t\tSlave");
      copyCollection(dbm, dbs, "users", (err, docs) => {
        if (err) console.log(err);
        copyCollection(dbm, dbs, "rides", (err1, docs1) => {
          if (err1) console.log(err1);
          console.log("Copied to new slave node");
        });
      });
    });
  });
};




var checkCounter = () => {
  Counts.find({ cid: 1 }).then((count) => {
    if (count.length == 0) {
      console.log(0);
      return 0;
    } else {
      docker.listContainers((err,containers) => {
        if(err) console.log(err);
        var countSlaves = 0;
        containers.forEach((containerInfo) => {
          if(containerInfo.Image=="slave:latest"){
            countSlaves+=1;
          }
          console.log("SlaveCount: "+countSlaves);
          console.log(containerInfo);
        });
        
        // console.log(containers);
      });
      console.log(count[0].counter);
      count[0].counter = 0;
      count[0].save();
      return count[0].counter;
    }
  });
};
setInterval(checkCounter, 120000);

router.route("/read").post((req, res, next) => {
  connectToServer("readQ", req.body, (responseMsg) => {
    /* Maintaing a counter variable in orchestrator db and incrementing by 1 on every subsequent read request */
    Counts.find({ cid: 1 }).then((count) => {
      if (count.length == 0) {
        Counts.create({ cid: 1, counter: 1 }).then((c) => {
          console.log("Counter created!!");
        });
      } else {
        Counts.findByIdAndUpdate(
          { _id: count[0]._id },
          { $inc: { counter: 1 } },
          { new: true },
          (err, Res) => {
            if (err) console.log(err);
          }
        );
      }
    });

    console.log("Message from readQ  ");
    console.log(responseMsg);
    res.statusCode = parseInt(responseMsg.statusCode);
    res.send(responseMsg.send);
  });
});

router.route("/write").post((req, res, next) => {
  connectToServer("writeQ", req.body, (msg) => {
    console.log(msg);
  });
  res.statusCode = 201;
  res.send();
});

var connectToServer = (requestFor, requestMsg, callback) => {
  amqp.connect("amqp://rabbitmq", function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
      //var msg = args.slice(1).join(' ') || 'Hello World!';
      var exchange = "orchestrate";
      channel.assertExchange("read_exchange", "direct", {
        durable: false,
      });
      channel.assertExchange("write_exchange", "direct", {
        durable: false,
      });
      channel.assertExchange("response_exchange", "direct", {
        durable: false,
      });
      channel.prefetch(1);
      /*If a worker is busy it will send the message to some other worker. 1message/worker at a time*/

      if (requestFor == "readQ") {
        /*Creating responseQ */
        channel.assertQueue("responseQ");

        /*Bind of responseQ */
        channel.bindQueue("responseQ", "response_exchange", "responseQ");
        var correlationId = generateUuid(); /*Generating a correlation id which will be unique for each request */

        /* RPC implementation with slave worker where request queue is readQ and callback queue is responseQ */

        /*Publishing the incoming request to readQ with callback queue as responseQ */
        channel.publish(
          "read_exchange",
          "readQ",
          Buffer.from(JSON.stringify(requestMsg)),
          { correlationId: correlationId, replyTo: "responseQ" }
        );
        /*Consume the response generated by the slave worker from responseQ */
        channel.consume(
          "responseQ",
          function (msg) {
            connection.close();
            console.log("RESPONSEQ response " + msg.content.toString());
            if (msg.properties.correlationId == correlationId) {
              //console.log('HERE');
            console.log("RESPONSEQ response " + msg.content.toString());
              //setTimeout(() => {connection.close()},1000);
              return callback(JSON.parse(msg.content));
      
              
            }
          },
          {
             noAck: true
           }
           
        );
      } else if (requestFor == "writeQ") {
        /* If args[0] is writeQ no need to make responseQ */
        /* Publishing all write requests to writeQ */
        channel.publish(
          "write_exchange",
          "writeQ",
          Buffer.from(JSON.stringify(requestMsg))
        );

        //connection.close();
        return callback("DONE!");
      } else {
        /* If no request has been made to readQ or writeQ then exit */
        connection.close();
        process.exit(0);
      }
    });
  });

  var generateUuid = () => {
    return (
      Math.random().toString() +
      Math.random().toString() +
      Math.random().toString()
    );
  };
};

module.exports = router;
