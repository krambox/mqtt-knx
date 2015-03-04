#!/usr/bin/env node

"use strict";

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


function listenEIBD(opts, callback) {
  var conn = eibd.Connection();

  conn.socketRemote(opts, function () {
    conn.openGroupSocket(0, callback);
  });
}


var client = mqtt.connect(argv.mqtt, function (parser) {
  parser.on('error', function (error) {
    error.log(error);
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

listenEIBD({host: argv.eibd, port: argv.eibdport}, function (parser) {

  parser.on('write', function (src, dest, type, val) {
    console.log('Write from ' + src + ' to ' + dest + ': ' + val + ' [' + type + ']');
    var message = getDPTValue(val, type);
    if (message) {
      console.log(argv.topic + '/' + dest, message);
      client.publish(argv.topic + '/' + dest, message, {retain: argv.retain});
    }
  });

});

