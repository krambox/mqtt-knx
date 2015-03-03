#!/usr/bin/env node

var
  eibd = require('eibd'),
  mqtt = require('mqtt'),
  optimist = require('optimist');


var argv = optimist
  .usage('mqtt-knx: receive shell commands on MQTT messages\n \
    Usage: mqtt-knx -b <broker-url> -h <eibd host> -p <eibd port>')
  .options('b', {
    describe: 'broker url',
    default: 'mqtt://localhost:1883',
    alias: 'brokerUrl'
  })
  .options('t', {
    describe: 'topic prefix',
    default: 'knxd',
    alias: 'topicPrefix'
  })
  .options('e', {
    describe: 'eibd host',
    default: 'localhost',
    alias: 'eibdHost'
  })
  .options('p', {
    describe: 'eibd port',
    default: '6720',
    alias: 'eibdPort'
  })
  .options('r', {
    describe: 'retain',
    default: false,
    alias: 'eibdPort'
  })
  .argv;


function groupsocketlisten(opts, callback) {

  var conn = eibd.Connection();

  conn.socketRemote(opts, function () {
    conn.openGroupSocket(0, callback);
  });

}

var host = argv.eibdHost;
var port = argv.eibdPort;
var client = mqtt.connect(argv.brokerUrl);

console.log(argv);

groupsocketlisten({host: host, port: port}, function (parser) {

  parser.on('write', function (src, dest, type, val) {
    console.log('Write from ' + src + ' to ' + dest + ': ' + val + ' [' + type + ']');

    var topic = argv.topicPrefix + '/' + dest;
    client.publish(topic, '' + val, {retain: argv.retain});
  });

  parser.on('response', function (src, dest, type, val) {
    console.log('Response from ' + src + ' to ' + dest + ': ' + val + ' [' + type + ']');

  });

  parser.on('read', function (src, dest) {
    console.log('Read from ' + src + ' to ' + dest);

  });

});
