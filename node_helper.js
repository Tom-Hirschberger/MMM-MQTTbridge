/* eslint-disable indent */
'use strict';

/* Magic Mirror
 * Module: MMM-MQTTbridge
 *
 * Forked from @sergge1
 * Modified by DanielHfnr
  * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const mqtt = require('mqtt');
const { notiHook, notiMqttCommands } = require('./dict/notiDictionary.js'); //read the custom NOTI->MQTT rules from external files (they are in a config.notiDictionary )
const { mqttHook, mqttNotiCommands } = require('./dict/mqttDictionary.js'); //read the custom MQTT->NOTI rules from external files (they are in a config.mqttDictionary )

module.exports = NodeHelper.create({
  start: function () {
    console.log('[MQTT bridge] Module started');
    this.clients = [];
    this.config = {};
  },

  connectMqtt: function (config) {
    var self = this;
    var client;

    if (typeof self.clients[config.mqttServer] === "undefined" || self.clients[config.mqttServer].connected == false) {
      client = mqtt.connect(config.mqttServer);
      self.clients[config.mqttServer] = client;

      client.on('error', function (error) { //MQTT library function. Returns ERROR when connection to the broker could not be established.
        console.log("[MQTT bridge] MQTT brocker error: " + error);
        self.sendSocketNotification('ERROR', { type: 'notification', title: '[MMM-MQTTbridge]', message: 'MQTT broker rised the following error: ' + error });
      });

      client.on('offline', function () { //MQTT library function. Returns OFFLINE when the client (our code) is not connected.
        console.log("[MQTT bridge] Could not establish connection to MQTT brocker");
        self.sendSocketNotification('ERROR', { type: 'notification', title: '[MMM-MQTTbridge]', message: "MQTT broker can't be reached" });
        client.end();
      });

      client.on('message', function (topic, message) {  //MQTT library function. Returns message topic/payload when it arrives to subscribed topics.
        console.log('[MQTT bridge] MQTT message received. Topic: ' + topic + ', message: ' + message.toString());
        self.sendSocketNotification('MQTT_MESSAGE_RECEIVED', { 'topic': topic, 'data': message.toString() }); // send mqtt mesage payload for further converting to NOTI to MMM-MQTTbridge.js file
      });   

    } else {
      client = self.clients[config.mqttServer];
    }

    if (config.mqttConfig.listenMqtt) {
      // subscription to MQTT topics from config
      for (var i = 0; i < mqttHook.length; i++) {
        if (!client.connected) {
          client.subscribe(mqttHook[i].mqttTopic);
          console.log("[MQTT bridge] Subscribed to the topic: " + mqttHook[i].mqttTopic);  
        }
      }
    };
  },

  // check all messages arrived from MMM-MQTTbridge.js
  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case 'MQTT_BRIDGE_CONNECT': //case which appear at sturt-up.It sends pre-read arrays of custom dictionaries
        this.connectMqtt(payload);
        this.sendSocketNotification("DICTIONARIES", { "notiHook": notiHook, "mqttHook": mqttHook, "notiMqttCommands": notiMqttCommands, "mqttNotiCommands": mqttNotiCommands });
        break;
      case 'MQTT_MESSAGE_SEND': // if this message arrived, commands below send MQTT message using payload information
        var client = this.clients[payload.mqttServer];
        if (typeof client !== "undefined") {
          client.publish(payload.topic, payload.payload);
        };
        console.log("[MQTT bridge] NOTI->MQTT. Topic: " + payload.topic + ", payload: " + payload.payload);
        break;
      case 'LOG':
        console.log(payload); //just to display LOG in Terminal, not console.
        break;
    }
  }
});
