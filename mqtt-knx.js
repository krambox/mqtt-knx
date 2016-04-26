#!/usr/bin/env node

var eibd = require('eibd');
var mqtt = require('mqtt');
var yaml_config = require('node-yaml-config');

var config = yaml_config.load(__dirname + '/config.yml');

var host = config.eibdHost;
var port = config.eibdPort;

var mqttClient = mqtt.connect(config.mqttHost);

var eibdConn = eibd.Connection();
var eibdOpts = { host: config.eibdHost, port: config.eibdPort };
var topic = 'knx';

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

mqttClient.subscribe(topic + '/+/+/+/set');

mqttClient.on('message', function (topic, message) {
    var gad = topic.split("/").slice(-4, -1).join('/');
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
                console.log(topic + '/' + dest, message);
                mqttClient.publish(topic + '/' + dest, message, { retain: true });
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

