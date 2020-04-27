/*                SLAVE: All the db/read operations will be performed here!                   */

var amqp = require('amqplib/callback_api');
var mongoose = require('mongoose');
const csv = require("csv-parser");
const fs = require("fs");
const Users = require("./models/users");
const Rides = require("./models/rides");
var protocol = 1;

mongoose.connect("mongodb://localhost:27017/slave").then((db) => {
    console.log("\t\t\tCorrectly connected to the server!!");
});

if (protocol == 1) {
    amqp.connect('amqp://localhost', function (error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            var exchange = 'orchestrate';
            channel.assertExchange(exchange, 'direct', {
                durable: false
            });
            channel.prefetch(1);
            /*ReadQ Declaration*/
            channel.assertQueue('readQ', {}, function (error2, q) {
                if (error2) {
                    throw error2;
                }
                console.log(' [x] Awaiting requests for readQ');
                channel.bindQueue('readQ', exchange, 'readQ'); /*ReadQ bind*/
                channel.consume('readQ', function reply(msg) { /*Consume from readQ, query it and send to responseQ*/
                    console.log(JSON.parse(msg.content));
                    processReadRequests(JSON.parse(msg.content), (response) => {
                        channel.publish(exchange, 'responseQ', Buffer.from(JSON.stringify(response)), { correlationId: msg.properties.correlationId });
                    });

                }, { noAck: true }); /*Sending to responseQ with appropriate correlationId*/
            }, { durable: true });
            channel.assertQueue('syncQ', {}, function (error2, q) {
                if (error2) {
                    throw error2;
                }
                console.log(' [*] Waiting for any syncQ changes!');
                channel.bindQueue(q.queue, exchange, 'syncQ');
                channel.consume(q.queue, function (msg) {
                    processSyncQRequests(JSON.parse(msg.content), (response) => {
                        console.log("Response message of syncQ");
                        console.log(response);
                    });
                }, {
                    noAck: true
                });
            }, { durable: true });





        });
    });
}
else {
    amqp.connect('amqp://localhost', function (error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            var exchange = 'orchestrate';
            channel.assertExchange(exchange, 'direct', {
                durable: false
            });
            channel.prefetch(1);
            /*Creating a writeQ to recieve all the write requests from orchestrator */
            channel.assertQueue('writeQ', {
            }, function (error, q) {
                if (error) {
                    throw error;
                }
                console.log(' [*] Waiting for any writeQ requests!');
                /*Binding with routing_key=writeQ */
                channel.bindQueue(q.queue, exchange, 'writeQ');
                /*Recieving the write requests from orchestrator */
                channel.consume(q.queue, function (msg) {
                    console.log(" [x] %s: '%s'", msg.fields.routingKey, msg.content.toString());
                    processSyncQRequests(JSON.parse(msg.content), (response) => {
                        console.log("Request for writeQ");
                        console.log(response);
                        channel.publish(exchange, 'syncQ', Buffer.from(JSON.stringify(JSON.parse(msg.content))));
                    });
                    /*Manipulate the message if required and send it to syncQ to make the changes to other worker's databases*/



                }, {
                    noAck: true
                });
            }, { durable: true });
        });
    });
}

/* Processing of requests by db/read */
var processReadRequests = (requestmessage, callback) => {
    var res = { 'statusCode': '', 'send': '' };
    var operation = requestmessage.operation;
    var table = requestmessage.table;
    if (operation == "upcoming") {
        var s = requestmessage.source;
        var d = requestmessage.destination;
        if (s.length == 0 || d.length == 0) {
            res.statusCode = '400';
            return callback(res);
        }
        else {
            var results = [];
            Rides.find({}).then((rides) => {
                fs.createReadStream('AreaNameEnum.csv')
                    .pipe(csv(['Area No']))
                    .on('data', (data) => {
                        results.push(data[0]);
                    })
                    .on('end', () => {
                        if (results.includes(s) && results.includes(d)) {
                            Rides.find({ source: s, destination: d }).then((ride) => {
                                if (ride.length == 0) {
                                    res.statusCode = "204";
                                    res.send = '';
                                    return callback(res);
                                }
                                else {
                                    var currentDate = new Date();
                                    var day = ("0" + currentDate.getDate()).slice(-2);
                                    var month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
                                    var year = currentDate.getFullYear();
                                    var hours = ("0" + currentDate.getHours()).slice(-2);
                                    var minutes = ("0" + currentDate.getMinutes()).slice(-2);
                                    var seconds = ("0" + currentDate.getSeconds()).slice(-2);
                                    var output = [];
                                    var k = 0;
                                    for (var key in ride) {
                                        var d = (ride[key].timestamp).slice(0, 2);
                                        var m = (ride[key].timestamp).slice(3, 5);
                                        var y = (ride[key].timestamp).slice(6, 10);
                                        var ss = (ride[key].timestamp).slice(11, 13);
                                        var mm = (ride[key].timestamp).slice(14, 16);
                                        var hh = (ride[key].timestamp).slice(17, 19);
                                        if ((y > year) || (y == year && m > month) || (y == year && m == month && d > day) || (y == year && d == day && m == month && hh > hours) || (y == year && d == day && m == month && hh == hours && mm > minutes) || (y == year && d == day && m == month && hh == hours && mm == minutes && ss > seconds)) {
                                            output[k] = {};
                                            output[k].rideId = ride[key].rideId;
                                            output[k].username = ride[key].username;
                                            output[k].timestamp = ride[key].timestamp;
                                            k = k + 1;
                                        }
                                    }
                                    if (k == 0) {
                                        res.statusCode = '204';
                                        return callback(res);
                                    }
                                    else {
                                        res.statusCode = '200';
                                        res.send = output;
                                        return callback(res);
                                    }
                                }
                            })
                        }
                        else {
                            res.statusCode = '400';
                            return callback(res);
                        }
                    })
            })
        }


    }
    else if (operation == "display") {
        if (table.toLowerCase() == "rides") {
            var id = requestmessage.rideId;
            if (id.length == 0) {
                res.statusCode = '400';
                return callback(res);
            }
            else {
                Rides.find({ rideId: id }).then((ride) => {
                    if (ride.length == 0) {
                        res.statusCode = '400';
                        return callback(res);
                    }
                    else {
                        var output = {};
                        output.rideId = id;
                        output.created_by = ride[0].created_by;
                        output.users = ride[0].users;
                        output.timestamp = ride[0].timestamp;
                        output.source = ride[0].source;
                        output.destination = ride[0].destination;
                        res.statusCode = '200';
                        res.send = output;
                        return callback(res);

                    }
                });
            }
        }
        else {
            Users.find({}).then(users => {
                if (users.length == 0) {
                    res.statusCode = '204';
                    return callback(res);
                }
                else {
                    var output = [];
                    for (var i = 0; i < users.length; i++) {
                        output.push(users[i].username);
                    }
                    res.statusCode = '200';
                    res.send = output;
                    return callback(res);
                }
            });
        }
    }



};

/* Writing to the database if any changes made by the db/write */
var processSyncQRequests = (requestmessage, callback) => {
    var res = { 'statusCode': '', 'send': '' };
    var operation = requestmessage.operation;
    var table = requestmessage.table;
    if (operation == "add") {
        var uname = requestmessage.username;
        var pwd = requestmessage.password;

        if (table.toLowerCase() == "users") {
            Users.create({ username: uname, password: pwd }).then((user) => {
                res.statusCode = '201';
                res.send = '';
                return callback(res);
            });
        }
        else {
            var cb = requestmessage.created_by;
            var time = requestmessage.timestamp;
            var s = requestmessage.source;
            var d = requestmessage.destination;
            var rides = requestmessage.rides;
            var Id;
            var us = [];
            if (rides.length == 0) {
                Id = 123;
            }
            else {
                var ma = 0;
                for (var key in rides) {
                    if (rides[key].rideId > ma) {
                        ma = rides[key].rideId;
                    }
                }
                Id = ma + 1;
            }
            us.push(cb);
            Rides.create({ created_by: cb, timestamp: time, source: s, destination: d, rideId: Id, users: us })
                .then((ride) => {
                    res.statusCode = '201';
                    res.send = '';
                    return callback(res);
                });
        }
    }
    else if (operation == 'join') {
        var id = requestmessage.rideId;
        var rides = requestmessage.rides;

        if ((rides[0].users).includes(req.body.username)) {
            res.statusCode = '201';
            res.send = '';
            return callback(res);
        }
        else {
            Rides.findByIdAndUpdate(rides[0]._id, { $push: { users: req.body.username } }, { 'new': true }, (err, r) => {
                if (err)
                    console.log(err);
                res.statusCode = '201';
                res.send = '';
                return callback(res);
            })
        }
    }
    else {
        if (table.toLowerCase() == "users") {
            Users.remove({ username: req.body.username }).then(() => {
                res.statusCode = '200';
                return callback(res);
            });
        }
        else {
            if (requestmessage.rideId.length == 0) {
                res.statusCode = '400';
                return callback(res);
            }
            else {
                Rides.remove({ rideId: requestmessage.rideId }).then(() => {
                    res.statusCode = '200';
                    res.send = '';
                    return callback(res);
                });
            }
        }
    }

};