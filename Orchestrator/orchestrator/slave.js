/*                SLAVE: All the db/read operations will be performed here!                   */

var amqp = require('amqplib/callback_api');
var mongoose = require('mongoose');


mongoose.connect("mongodb://localhost:27017/slave").then((db) => {
    console.log("\t\t\tCorrectly connected to the server!!");
});


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
            console.log(' [x] Awaiting RPC requests');
            channel.bindQueue('readQ', exchange, 'readQ'); /*ReadQ bind*/
            channel.consume('readQ', function reply(msg) { /*Consume from readQ, query it and send to responseQ*/

                console.log(msg.content.toString());
                channel.publish(exchange, 'responseQ', Buffer.from("response message to publish in response q"), { correlationId: msg.properties.correlationId });
            }, { noAck: true }); /*Sending to responseQ with appropriate correlationId*/
        }, { durable: true });
        channel.assertQueue('syncQ', {}, function (error2, q) {
            if (error2) {
                throw error2;
            }
            console.log(' [*] Waiting for logs. To exit press CTRL+C');
            channel.bindQueue(q.queue, exchange, 'syncQ');
            channel.consume(q.queue, function (msg) {
                console.log(msg.content.toString());
            }, {
                noAck: true
            });
        }, { durable: true });





    });
});