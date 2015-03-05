# mqtt-knx

KNX to MQTT Bridge.

##Install

Prepare eibd und mosquitto

    npm install

##Usage

    Usage: ./mqtt-knx.js -b <broker-url> -h <eibd host> -p <eibd port>

    Options:
      -e, --eibd      eibd hostname             [required]
      -p, --eibdport  eibd port                 [default: "6720"]
      -m, --mqtt      mqtt url                  [default: "mqtt://localhost"]
      -t, --topic     mqtt topic prefix         [default: "knx"]
      -r, --retain    publish with retain flag


##Example

Send DPT1 as true/false, DPT5 as 0..100% and DPT9 values to a mqtt broker. The topic is like 'knx/1/1/111'

    ./mqtt-knx.js -e smarthome -m mqtt://localhost

Subcript all knx messages

    mosquitto_sub  -h mac-server.local -t 'knx/#' -v


Switch lamp on/off with a publish to the broker

    mosquitto_pub -h mac-server.local -t 'knx/1/1/111/set' -m 'false'
    mosquitto_pub -h mac-server.local -t 'knx/1/1/111/set' -m 'false'
