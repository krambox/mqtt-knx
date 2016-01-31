#!/usr/bin/env node

var eibd = require('eibd');
var mqtt = require('mqtt');
var yaml_config = require('node-yaml-config');

var config = yaml_config.load(__dirname + '/config.yml');

/**
 * groupsocketlisten
 */
function groupsocketlisten(opts, callback) {
    var conn = eibd.Connection();
    conn.socketRemote(opts, function () {
        conn.openGroupSocket(0, callback);
    });
}

var host = config.eibdHost;
var port = config.eibdPort;

var client = mqtt.connect(config.mqttHost);

groupsocketlisten({ host: host, port: port }, function (parser) {
    parser.on('write', function (src, dest, type, val) {
        console.log('Write from ' + src + ' to ' + dest + ': ' + val + ' [' + type + ']');
        client.publish('eibd/' + dest, '' + val, { retain: true });
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
