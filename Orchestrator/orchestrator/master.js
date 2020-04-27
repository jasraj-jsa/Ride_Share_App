/*                    MASTER: All the db/write operations will be performed here!                       */

var amqp = require('amqplib/callback_api');
var mongoose = require('mongoose');
/*var args = process.argv.slice(2);
console.log(args);
if (args.length == 0) {
    console.log("No routing key");
    process.exit(1);
}*/

mongoose.connect("mongodb://localhost:27017/master").then((db) => {
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
        /*Creating a writeQ to recieve all the write requests from orchestrator */
        channel.assertQueue('writeQ', {
        }, function (error, q) {
            if (error) {
                throw error;
            }
            console.log(' [*] Waiting for logs. To exit press CTRL+C');
            /*Binding with routing_key=writeQ */
            channel.bindQueue(q.queue, exchange, 'writeQ');
            /*Recieving the write requests from orchestrator */
            channel.consume(q.queue, function (msg) {
                console.log(" [x] %s: '%s'", msg.fields.routingKey, msg.content.toString());
                /*Manipulate the message if required and send it to syncQ to make the changes to other worker's databases*/
                channel.publish(exchange, 'syncQ', Buffer.from("Messge for syncQ by the master! Make all the changes"));


            }, {
                noAck: true
            });
        }, { durable: true });
    });
});