/* eslint-disable indent */
"use strict";
/* global Module */

/* Magic Mirror
 * Module: MMM-MQTTbridge
 *
 * Forked from @sergge1
 * Modified by DanielHfnr
 * MIT Licensed.
 */

Module.register("MMM-MQTTbridge", {
  defaults: {
    mqttServer: "mqtt://:@localhost:1883",
    stringifyPayload: true,
    notiConfig:
    {
      listenNoti: true,
      ignoreNotiId: [],
      ignoreNotiSender: [],
    },
    mqttConfig:
    {
      rejectUnauthorized: true,
      listenMqtt: true,
      interval: 300000,
    },

    // MQTT -> NOTI rules Dictionary - should be set in this structure within ./dict/mqttDictionary.js
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
    const self = this
    Log.info("Starting module: " + self.name);
    self.loaded = false;
    self.mqttVal = "";
    self.updateMqtt(this);
  },

  updateMqtt: function (self) {
    self.sendSocketNotification("MQTT_BRIDGE_CONNECT", { mqttServer: self.config.mqttServer, mqttDictionary: self.config.mqttDictionary, mqttConfig: self.config.mqttConfig }); //request to connect to the MQTT broker
    setTimeout(self.updateMqtt, self.config.mqttConfig.interval, self);
  },

  publishNotiToMqtt: function(topic, payload) {
    const self = this
    self.sendSocketNotification("MQTT_MESSAGE_SEND", {
      mqttServer: self.config.mqttServer,
      topic: topic,
      payload: payload,
    });
  },

  mqttToNoti: function (payload) {
    const self = this
    // go through MQTT DICTIONARY
    for (var i = 0; i < self.config.mqttDictionary.mqttHook.length; i++) 
    {
      // search topic specified in mqttDictionary
      if (payload.topic == self.config.mqttDictionary.mqttHook[i].mqttTopic)
      {
        for (var k = 0; k < self.config.mqttDictionary.mqttHook[i].mqttPayload.length; k++) 
        {
          // When payloadValue is specified in mqttDictionary and matches the actual payload --> continue
          // If payloadValue in mqttDictionary is empty --> continue
          if (self.config.mqttDictionary.mqttHook[i].mqttPayload[k].payloadValue == payload.data || self.config.mqttDictionary.mqttHook[i].mqttPayload[k].payloadValue == '') 
          {
            // search COMMAND within COMMAND list
            for (var j = 0; j < self.config.mqttDictionary.mqttHook[i].mqttPayload[k].mqttNotiCmd.length; j++) 
            {
              for (var x in self.config.mqttDictionary.mqttNotiCommands) 
              { 
                if (self.config.mqttDictionary.mqttHook[i].mqttPayload[k].mqttNotiCmd[j] == self.config.mqttDictionary.mqttNotiCommands[x].commandId) 
                {
                  // Decision: Send payload specified in the mqttDictionary oder send the actual payload of mqtt message
                  if (self.config.mqttDictionary.mqttHook[i].mqttPayload[k].payloadValue == '') 
                  {
                    self.sendNotification(self.config.mqttDictionary.mqttNotiCommands[x].notiID, payload.data);
                    self.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + self.config.mqttDictionary.mqttNotiCommands[x].notiID + ", payload: "+ payload.data);
                  } 
                  else 
                  {
                    self.sendNotification(self.config.mqttDictionary.mqttNotiCommands[x].notiID, self.config.mqttDictionary.mqttNotiCommands[x].notiPayload);
                    self.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + self.config.mqttDictionary.mqttNotiCommands[x].notiID + ", payload: "+ self.config.mqttDictionary.mqttNotiCommands[x].notiPayload);
                  }  
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
  },

  notiToMqtt: function(notification, payload) {
    const self = this
    // search NOTIFICATIONS and PAYLOADS within DICTIONARY. start with NOTI ID
    for (var i = 0; i < self.config.notiDictionary.notiHook.length; i++) 
    {
      if (self.config.notiDictionary.notiHook[i].notiId === notification) 
      {
        // if Payload is empty in config file --> send noti payload to mqtt
        for (var j = 0; j < self.config.notiDictionary.notiHook[i].notiPayload.length; j++) 
        {
          if (JSON.stringify(self.config.notiDictionary.notiHook[i].notiPayload[j].payloadValue) === JSON.stringify(payload) || self.config.notiDictionary.notiHook[i].notiPayload[j].payloadValue == '') 
          {
            // if NOTI ID and Payload found - search for Commands (could be an array of commands)
            for (var k = 0; k < self.config.notiDictionary.notiHook[i].notiPayload[j].notiMqttCmd.length; k++) 
            {
              for (var x in self.config.notiDictionary.notiMqttCommands) 
              {
                if (self.config.notiDictionary.notiHook[i].notiPayload[j].notiMqttCmd[k] == self.config.notiDictionary.notiMqttCommands[x].commandId) 
                {
                  let curStringifyPayload
                  if (typeof self.config.notiDictionary.notiMqttCommands[x].stringifyPayload !== "undefined"){
                    curStringifyPayload = self.config.notiDictionary.notiMqttCommands[x].stringifyPayload
                  } else {
                    curStringifyPayload = self.config.stringifyPayload
                  }
                  // if NOTI matched in the Dictionary, send respective MQTT message
                  // If payloadValue is empty in notiDictionary --> send payload of Notification to MQTT - Otherwise send payload defined in notiDictionary
                  if (self.config.notiDictionary.notiHook[i].notiPayload[j].payloadValue == '') 
                  {
                    if (curStringifyPayload){
                      self.publishNotiToMqtt(self.config.notiDictionary.notiMqttCommands[x].mqttTopic, JSON.stringify(payload));
                    } else {
                      self.publishNotiToMqtt(self.config.notiDictionary.notiMqttCommands[x].mqttTopic, payload);
                    }
                  } 
                  else 
                  {
                    if (curStringifyPayload){
                      self.publishNotiToMqtt(self.config.notiDictionary.notiMqttCommands[x].mqttTopic, JSON.stringify(self.config.notiDictionary.notiMqttCommands[x].mqttMsgPayload));
                    } else {
                      self.publishNotiToMqtt(self.config.notiDictionary.notiMqttCommands[x].mqttTopic, self.config.notiDictionary.notiMqttCommands[x].mqttMsgPayload);
                    }
                  }
                  break;
                }
              }
            }
            break;
          }
        }
        continue;
      }
    }  
  },

  socketNotificationReceived: function (notification, payload) {
    const self = this
    switch (notification) {
      // START MQTT to NOTI logic
      case "MQTT_MESSAGE_RECEIVED":
        self.mqttToNoti(payload);
        break;
      // END of MQTT to NOTI logic
      case "ERROR":
        self.sendNotification("SHOW_ALERT", payload);
        break;
      case "DICTIONARIES": //use dictionaries from external files at module sturt-up
        self.config.notiDictionary.notiHook = payload.notiHook;
        self.config.notiDictionary.notiMqttCommands = payload.notiMqttCommands;
        self.config.mqttDictionary.mqttHook = payload.mqttHook;
        self.config.mqttDictionary.mqttNotiCommands = payload.mqttNotiCommands;
        break;
    }
  },

  notificationReceived: function (notification, payload, sender) {
    const self = this
    // START of NOTIFICATIONS to MQTT logic

    // Filtering...
    if (!self.config.notiConfig.listenNoti) { return; } // check whether we need to listen for the NOTIFICATIONS. Return if "false"
    var sndname = "system"; //sender name default is "system"

    if (!sender === false) { sndname = sender.name; }; //if no SENDER specified in NOTIFICATION, the SENDER is left as "system" (according to MM documentation), otherwise - use sender name
    var self = this;
    
    // exclude NOTIFICATIONS where SENDER in ignored list
    for (var x in self.config.notiConfig.ignoreNotiSender) 
    {
      if (sndname == self.config.notiConfig.ignoreNotiSender[x]) { return; }
    }
    // exclude NOTIFICATIONS where NOTIFICATION ID in ignored list
    for (var x in self.config.notiConfig.ignoreNotiId) 
    {
      if (notification == self.config.notiConfig.ignoreNotiId[x]) { return; }
    }


    self.notiToMqtt(notification, payload);
  }
  // END of NOTIFICATIONS to MQTT logic
});
