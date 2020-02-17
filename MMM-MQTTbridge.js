/* eslint-disable indent */
"use strict";
/* global Module */

/* Magic Mirror
 * Module: MMM-MQTTbridge
 *
 * By sergge1
 * MIT Licensed.
 */

Module.register("MMM-MQTTbridge", {
  defaults: {
    mqttServer: "mqtt://:@localhost:1883",
    notiConfig:
    {
      listenNoti: true,
      useMqttBridgeFromatOnly: false,
      ignoreNotiId: [],
      ignoreNotiSender: [],
    },
    mqttConfig:
    {
      listenMqtt: true,
      useMqttBridgeFromatOnly: true,
      interval: 300000,
      topicSubscr: [],
    },
    // MQTT -> NOTI rules Dictionary - should be set in this structure within ./dict/notiDictionary.js
    mqttDictionary: {

    },
    // NOTIF -> MQTT rules Dictionary - should be set in this structure within ./dict/notiDictionary.js
    notiDictionary: {
      notiHook: [
        {
          notiId: "",
          notiPayload: "",
          notiMqttCmd: [],
        }
      ],
      notiMqttCommands: [
        {
          commandId: "",
          mqttTopic: "",
          mqttMsgPayload: [],
        }
      ]
    },
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.loaded = false;
    this.mqttVal = "";
    this.updateMqtt(this);
  },

  updateMqtt: function (self) {
    self.sendSocketNotification("MQTT_BRIDGE_CONNECT", { mqttServer: self.config.mqttServer, mqttDictionary: self.config.mqttDictionary, mqttConfig: self.config.mqttConfig });
    setTimeout(self.updateMqtt, self.config.mqttConfig.interval, self);
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "MQTT_MESSAGE_RECEIVED":
        // START MQTT to NOTI logic
        if (this.config.mqttConfig.useMqttBridgeFromatOnly) {
          // substract NOTI ID and NOTI PAYLOAD from the MQTT message Payload and send NOTIFICATION
          var mqttNoti = payload.data.slice(0, payload.data.indexOf(":"));
          var mqttPayload = payload.data.slice(payload.data.indexOf(":") + 1);
          this.sendNotification(mqttNoti, mqttPayload);
          this.sendSocketNotification("LOG", "[MQTT bridge] MQTT -> NOTI issued: " + mqttNoti + ", payload: "+ mqttPayload);
        } else { //if 
          // search payload useMqttBridgeFromatOnly is false - search MQTT messages within DICTIONARY
          for (var i = 0; i < this.config.mqttDictionary.mqttHook.length; i++) {
            if (payload.data == this.config.mqttDictionary.mqttHook[i].mqttPayload) {
              for (var j = 0; j < this.config.mqttDictionary.mqttHook[i].mqttNotiCmd.length; j++) {
                for (var x in this.config.mqttDictionary.mqttNotiCommands) {
                  if (this.config.mqttDictionary.mqttHook[i].mqttNotiCmd[j] == this.config.mqttDictionary.mqttNotiCommands[x].commandId) {
                    this.sendNotification(this.config.mqttDictionary.mqttNotiCommands[x].notiID, this.config.mqttDictionary.mqttNotiCommands[x].notiPayload);
                    this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + this.config.mqttDictionary.mqttNotiCommands[x].notiID + ", payload: "+ this.config.mqttDictionary.mqttNotiCommands[x].notiPayload);
                    break;
                  }
                }
              }
              break;
            }
          }
        }
        break;
      // END of MQTT to NOTI logic
      case "ERROR":
        this.sendNotification("SHOW_ALERT", payload);
        break;
      case "DICTIONARIES": //append dictionaries from external files
        this.config.notiDictionary.notiHook = payload.notiHook;
        this.config.notiDictionary.notiMqttCommands = payload.notiMqttCommands;
        this.config.mqttDictionary.mqttHook = payload.mqttHook;
        this.config.mqttDictionary.mqttNotiCommands = payload.mqttNotiCommands;
        break;
    }
  },

  notificationReceived: function (notification, payload, sender) {
    // START of NOTIFICATIONS to MQTT logic
    if (!this.config.notiConfig.listenNoti) { return; } // check whether do we need to listen for the NOTIFICATIONS. Return if "false"
    var sndname = "system";

    if (!sender === false) { sndname = sender.name; }; //if no SENDER specified in NOTIFICATION, the SENDER is set to "system" (according to MM documentation), otherwise - use sender name
    var self = this;
    if (this.config.notiConfig.useMqttBridgeFromatOnly) { // check if we are interested in NOTI_TO_MQTT notifications only or not. For saving CPU usage if not unnecessary to check all NOTIs
      if (notification == "NOTI_TO_MQTT") {
        this.sendSocketNotification("MQTT_MESSAGE_SEND", {
          mqttServer: self.config.mqttServer,
          topic: payload.mqttTopic,
          payload: payload.mqttPayload,
        });
      }
      //if useMqttBridgeFromatOnly is false - check all the NOTIFICATIONS
    } else {
      // exclude NOTIFICATIONS where SENDER in ignore list
      for (var x in this.config.notiConfig.ignoreNotiSender) {
        if (sndname == this.config.notiConfig.ignoreNotiSender[x]) { return; }
      }
      // exclude NOTIFICATIONS where NOTIFICATION ID in ignore list
      for (var x in this.config.notiConfig.ignoreNotiId) {
        if (notification == this.config.notiConfig.ignoreNotiId[x]) { return; }
      }
      // search NOTIFICATIONS and PAYLOADS within DICTIONARY
      for (var i = 0; i < this.config.notiDictionary.notiHook.length; i++) {
        if (this.config.notiDictionary.notiHook[i].notiId === notification) {
          for (var j = 0; j < this.config.notiDictionary.notiHook[i].notiPayload.length; j++) {
            if (this.config.notiDictionary.notiHook[i].notiPayload[j].payloadValue == payload) {
              for (var k = 0; k < this.config.notiDictionary.notiHook[i].notiPayload[j].notiMqttCmd.length; k++) {
                for (var x in this.config.notiDictionary.notiMqttCommands) {
                  if (this.config.notiDictionary.notiHook[i].notiPayload[j].notiMqttCmd[k] == this.config.notiDictionary.notiMqttCommands[x].commandId) {
                    // if NOTI matched in the Dictionary, send respective MQTT message
                    this.sendSocketNotification("MQTT_MESSAGE_SEND", {
                      mqttServer: self.config.mqttServer,
                      topic: this.config.notiDictionary.notiMqttCommands[x].mqttTopic,
                      payload: this.config.notiDictionary.notiMqttCommands[x].mqttMsgPayload,
                    });
                    break;
                  }
                }
              }
              break;
            }
          }
          break;
        }
      }
    }
  }
  // END of NOTIFICATIONS to MQTT logic

});
