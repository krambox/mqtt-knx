#!/usr/bin/env node

var eibd = require('eibd');
var mqtt    = require('mqtt');

 

/**
 * groupsocketlisten
 */
function groupsocketlisten(opts, callback) {

  var conn = eibd.Connection();

  conn.socketRemote(opts, function() {
    
    conn.openGroupSocket(0, callback);

  });

}

var host = '192.168.1.100'
var port = '6720'

var client  = mqtt.connect('mqtt://localhost');

groupsocketlisten({ host: host, port: port }, function(parser) {

  parser.on('write', function(src, dest, type, val){
    console.log('Write from '+src+' to '+dest+': '+val+' ['+type+']');
    
    client.publish('eibd/'+dest, ''+val, {retain: true});
  });

  parser.on('response', function(src, dest, type, val) {
    console.log('Response from '+src+' to '+dest+': '+val+' ['+type+']');
    //client.publish('eibd/'+dest, 'Response from src: '+src+': '+val+' ['+type+']', {retain: true});

  });
  
  parser.on('read', function(src, dest) {
    console.log('Read from '+src+' to '+dest);
    //client.publish('eibd/'+dest, 'Read from src: '+src, {retain: true});

  });

});
