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


function groupsocketlisten(opts, callback) {
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
      return val.toString() + '%';
    case 'DPT9':
      return val.toString();
    default:
      return undefined;
  }
}

groupsocketlisten({host: argv.eibd, port: argv.eibdport}, function (parser) {

  parser.on('write', function (src, dest, type, val) {
    var message = getDPTValue(val, type);
    if (message) {
      client.publish(argv.topic + '/' + dest, message, {retain: argv.retain});
    }
    else {
      console.log('Write from ' + src + ' to ' + dest + ': ' + val + ' [' + type + ']');

    }
  });

  parser.on('response', function (src, dest, type, val) {
    console.log('Response from ' + src + ' to ' + dest + ': ' + val + ' [' + type + ']');
    //client.publish('eibd/'+dest, 'Response from src: '+src+': '+val+' ['+type+']', {retain: true});

  });

  parser.on('read', function (src, dest) {
    console.log('Read from ' + src + ' to ' + dest);
    //client.publish('eibd/'+dest, 'Read from src: '+src, {retain: true});

  });

});

