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
    notiConfig:
    {
      listenNoti: true,
      ignoreNotiId: [],
      ignoreNotiSender: [],
    },
    mqttConfig:
    {
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
    Log.info("Starting module: " + this.name);
    this.loaded = false;
    this.mqttVal = "";
    this.updateMqtt(this);
  },

  updateMqtt: function (self) {
    self.sendSocketNotification("MQTT_BRIDGE_CONNECT", { mqttServer: self.config.mqttServer, mqttDictionary: self.config.mqttDictionary, mqttConfig: self.config.mqttConfig }); //request to connect to the MQTT broker
    setTimeout(self.updateMqtt, self.config.mqttConfig.interval, self);
  },

  publishNotiToMqtt: function(topic, payload) {
    this.sendSocketNotification("MQTT_MESSAGE_SEND", {
      mqttServer: this.config.mqttServer,
      topic: topic,
      payload: payload,
    });
  },

  mqttToNoti: function (payload) {
    // go through MQTT DICTIONARY
    for (var i = 0; i < this.config.mqttDictionary.mqttHook.length; i++) 
    {
      // search topic specified in mqttDictionary
      if (payload.topic == this.config.mqttDictionary.mqttHook[i].mqttTopic)
      {
        for (var k = 0; k < this.config.mqttDictionary.mqttHook[i].mqttPayload.length; k++) 
        {
          // When payloadValue is specified in mqttDictionary and matches the actual payload --> continue
          // If payloadValue in mqttDictionary is empty --> continue
          if (this.config.mqttDictionary.mqttHook[i].mqttPayload[k].payloadValue == payload.data || this.config.mqttDictionary.mqttHook[i].mqttPayload[k].payloadValue == '') 
          {
            // search COMMAND within COMMAND list
            for (var j = 0; j < this.config.mqttDictionary.mqttHook[i].mqttPayload[k].mqttNotiCmd.length; j++) 
            {
              for (var x in this.config.mqttDictionary.mqttNotiCommands) 
              { 
                if (this.config.mqttDictionary.mqttHook[i].mqttPayload[k].mqttNotiCmd[j] == this.config.mqttDictionary.mqttNotiCommands[x].commandId) 
                {
                  // Decision: Send payload specified in the mqttDictionary oder send the actual payload of mqtt message
                  if (this.config.mqttDictionary.mqttHook[i].mqttPayload[k].mqttPayload == '') 
                  {
                    this.sendNotification(this.config.mqttDictionary.mqttNotiCommands[x].notiID, payload.data);
                    this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + this.config.mqttDictionary.mqttNotiCommands[x].notiID + ", payload: "+ payload.data);
                  } 
                  else 
                  {
                    this.sendNotification(this.config.mqttDictionary.mqttNotiCommands[x].notiID, this.config.mqttDictionary.mqttNotiCommands[x].notiPayload);
                    this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + this.config.mqttDictionary.mqttNotiCommands[x].notiID + ", payload: "+ this.config.mqttDictionary.mqttNotiCommands[x].notiPayload);
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
    // search NOTIFICATIONS and PAYLOADS within DICTIONARY. start with NOTI ID
    for (var i = 0; i < this.config.notiDictionary.notiHook.length; i++) 
    {
      if (this.config.notiDictionary.notiHook[i].notiId === notification) 
      {
        // if Payload is empty in config file --> send noti payload to mqtt
        for (var j = 0; j < this.config.notiDictionary.notiHook[i].notiPayload.length; j++) 
        {
          if (this.config.notiDictionary.notiHook[i].notiPayload[j].payloadValue == payload || this.config.notiDictionary.notiHook[i].notiPayload[j].payloadValue == '') 
          {
            // if NOTI ID and Payload found - search for Commands (could be an array of commands)
            for (var k = 0; k < this.config.notiDictionary.notiHook[i].notiPayload[j].notiMqttCmd.length; k++) 
            {
              for (var x in this.config.notiDictionary.notiMqttCommands) 
              {
                if (this.config.notiDictionary.notiHook[i].notiPayload[j].notiMqttCmd[k] == this.config.notiDictionary.notiMqttCommands[x].commandId) 
                {
                  // if NOTI matched in the Dictionary, send respective MQTT message
                  // If payloadValue is empty in notiDictionary --> send payload of Notification to MQTT - Otherwise send payload defined in notiDictionary
                  if (this.config.notiDictionary.notiHook[i].notiPayload[j].payloadValue == '') 
                  {
                    this.publishNotiToMqtt(this.config.notiDictionary.notiMqttCommands[x].mqttTopic, payload.toString());
                  } 
                  else 
                  {
                    this.publishNotiToMqtt(this.config.notiDictionary.notiMqttCommands[x].mqttTopic, this.config.notiDictionary.notiMqttCommands[x].mqttMsgPayload.toString());
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

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      // START MQTT to NOTI logic
      case "MQTT_MESSAGE_RECEIVED":
        this.mqttToNoti(payload);
        break;
      // END of MQTT to NOTI logic
      case "ERROR":
        this.sendNotification("SHOW_ALERT", payload);
        break;
      case "DICTIONARIES": //use dictionaries from external files at module sturt-up
        this.config.notiDictionary.notiHook = payload.notiHook;
        this.config.notiDictionary.notiMqttCommands = payload.notiMqttCommands;
        this.config.mqttDictionary.mqttHook = payload.mqttHook;
        this.config.mqttDictionary.mqttNotiCommands = payload.mqttNotiCommands;
        break;
    }
  },

  notificationReceived: function (notification, payload, sender) {
    // START of NOTIFICATIONS to MQTT logic

    // Filtering...
    if (!this.config.notiConfig.listenNoti) { return; } // check whether we need to listen for the NOTIFICATIONS. Return if "false"
    var sndname = "system"; //sender name default is "system"

    if (!sender === false) { sndname = sender.name; }; //if no SENDER specified in NOTIFICATION, the SENDER is left as "system" (according to MM documentation), otherwise - use sender name
    var self = this;
    
    // exclude NOTIFICATIONS where SENDER in ignored list
    for (var x in this.config.notiConfig.ignoreNotiSender) 
    {
      if (sndname == this.config.notiConfig.ignoreNotiSender[x]) { return; }
    }
    // exclude NOTIFICATIONS where NOTIFICATION ID in ignored list
    for (var x in this.config.notiConfig.ignoreNotiId) 
    {
      if (notification == this.config.notiConfig.ignoreNotiId[x]) { return; }
    }


    this.notiToMqtt(notification, payload);
  }
  // END of NOTIFICATIONS to MQTT logic
});
