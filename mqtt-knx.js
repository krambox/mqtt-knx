#!/usr/bin/env node

'use strit';

var eibd = require('eibd'),
  mqtt = require('mqtt'),
  optimist = require('optimist');


var argv = optimist
  .usage('Usage: $0 -b <broker-url> -h <eibd host> -p <eibd port>')
  .demand('e').alias('e', 'eibd').describe('e', 'eibd hostname')
  .default('p', '6720').alias('p', 'eibdport').describe('p', 'eibd port')
  .default('m', 'mqtt://localhost').alias('m', 'mqtt').describe('m', 'mqtt url')
  .default('t', 'knx').alias('t', 'topic').describe('t', 'mqtt topic prefix')
  .boolean('r').alias('r', 'retain').describe('r', 'publish with retain flag')
  .argv;


var mqttClient = mqtt.connect(argv.mqtt);

var eibdConn = eibd.Connection();
var eibdOpts = {host: argv.eibd, port: argv.eibdport};

function groupWrite(gad, messageAction, DPTType, value) {
  console.log('groupWrite', gad, messageAction, DPTType, value);
  var address = eibd.str2addr(gad);
  eibdConn.socketRemote(eibdOpts, function () {
    eibdConn.openTGroup(address, 1, function (err) {
      var msg = eibd.createMessage(messageAction, DPTType, parseInt(value));
      eibdConn.sendAPDU(msg, function (err) {
        if (err) {
          console.error(err);
        }
      });
    });
  });
}

mqttClient.subscribe(argv.topic + '/+/+/+/set');

mqttClient.on('message', function (topic, message) {
  var gad = topic.substr(argv.topic.length + 1, topic.length - argv.topic.length - 5);
  var value = message.toString();
  console.log('mqttClient.on', gad, value);
  if (value === 'true') {
    groupWrite(gad, 'write', 'DPT3', '1');
  }
  else if (value === 'false') {
    groupWrite(gad, 'write', 'DPT3', '0');
  }
  else {
    groupWrite(gad, 'write', 'DPT5', value);
  }
});

eibdConn.socketRemote(eibdOpts, function () {
  eibdConn.openGroupSocket(0, function (parser) {
    parser.on('write', function (src, dest, type, val) {
      var message = getDPTValue(val, type);
      if (message) {
        console.log(argv.topic + '/' + dest, message);
        mqttClient.publish(argv.topic + '/' + dest, message, {retain: argv.retain});
      }
    });
  });
});

function getDPTValue(val, type) {
  switch (type) {
    case 'DPT1':
      if (val === 0) {
        return 'false';
      } else {
        return 'true';
      }
      break;
    case 'DPT5':
      return (val * 100 / 255).toFixed(1) + '%';
    case 'DPT9':
      return val.toFixed(2);
    default:
      return undefined;
  }
}

