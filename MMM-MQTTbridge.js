/* eslint-disable indent */
"use strict";
/* global Module */

/* Magic Mirror
 * Module: MMM-MQTTbridge
 * MIT Licensed.
 */

Module.register("MMM-MQTTbridge", {
  defaults: {
    mqttDictConf: "./dict/mqttDictionary.js",
    notiDictConf: "./dict/notiDictionary.js",
    mqttServer: "mqtt://:@localhost:1883",
    stringifyPayload: true,
    notiConfig: {}, //default values will be set in start function
    mqttConfig: {}, //default values will be set in start function
  },

  start: function () {
    const self = this
    Log.info("Starting module: " + self.name);
    self.config.mqttConfig = Object.assign({
      qos: 0,
      retain: false,
      clean: true,
      rejectUnauthorized: true,
      listenMqtt: false,
      interval: 300000,
    },self.config.mqttConfig)
    
    self.config.notiConfig = Object.assign({
      qos: 0,
      listenNoti: false,
      ignoreNotiId: [],
      ignoreNotiSender: [],
    },self.config.notiConfig)

    self.sendSocketNotification("CONFIG", self.config);
    self.loaded = false;
    self.mqttVal = "";
    setTimeout(() => {
      self.updateMqtt();
    }, 500);
    self.cnotiHook = {}
    self.cnotiMqttCommands = {}
    self.cmqttHook = {}
    self.cmqttNotiCommands = {}
  },

  updateMqtt: function () {
    const self = this
    self.sendSocketNotification("MQTT_BRIDGE_CONNECT"); //request to connect to the MQTT broker

    setTimeout(() => {
      self.updateMqtt();
    }, self.config.mqttConfig.interval);
  },

  publishNotiToMqtt: function(topic, payload, options = {}) {
    const self = this
    self.sendSocketNotification("MQTT_MESSAGE_SEND", {
      mqttServer: self.config.mqttServer,
      topic: topic,
      payload: payload,
      options: options
    });
  },

  mqttToNoti: function (payload) {
    const self = this
    let msg = payload.data
    let curMqttHook = self.cmqttHook[payload.topic]

    for(let curHookIdx=0; curHookIdx < curMqttHook.length; curHookIdx++){
      let curHookConfig = curMqttHook[curHookIdx]
      // {
      //   payloadValue: '{"state": "ON"}',
      //   mqttNotiCmd: ["Command 1"]
      // },
      if ( 
        (typeof curHookConfig.payloadValue === "undefined") ||
        (curHookConfig.payloadValue == msg)
      ){
        let mqttCmds = curHookConfig.mqttNotiCmd || []
        for(let curCmdIdx = 0; curCmdIdx < mqttCmds.length; curCmdIdx++){
          let curCmdConfigs = self.cmqttNotiCommands[mqttCmds[curCmdIdx]]
          for(let curCmdConfIdx = 0; curCmdConfIdx < curCmdConfigs.length; curCmdConfIdx++){
            let curCmdConf = curCmdConfigs[curCmdConfIdx]
            // {
            //   commandId: "Command 1",
            //   notiID: "REMOTE_ACTION",
            //   notiPayload: {action: 'MONITORON'}
            // },
            if (typeof curCmdConf.notiID !== "undefined"){
              if (typeof curCmdConf.notiPayload === "undefined") {
                self.sendNotification(curCmdConf.notiID, msg)
                this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + curCmdConf.notiID + ", payload: "+ msg);
              } else {
                self.sendNotification(curCmdConf.notiID, curCmdConf.notiPayload)
                this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + curCmdConf.notiID + ", payload: "+ JSON.stringify(curCmdConf.notiPayload));
              }
            } else {
              this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI error: Skipping notification cause \"notiID\" is missing. "+JSON.stringify(curCmdConf));
            }
          }
        }
      }
    }
  },

  notiToMqtt: function(notification, payload) {
    const self = this
    let curNotiHooks = self.cnotiHook[notification]
    for(let curHookIdx = 0; curHookIdx < curNotiHooks.length; curHookIdx++){
      let curHookConfig = curNotiHooks[curHookIdx]
      // {
      //   payloadValue: true, 
      //   notiMqttCmd: ["SCREENON"]
      // },
      if ( 
        (typeof curHookConfig.payloadValue === "undefined") ||
        (JSON.stringify(curHookConfig.payloadValue) == JSON.stringify(payload))
      ){
        let notiCmds = curHookConfig.notiMqttCmd || []
        for(let curCmdIdx = 0; curCmdIdx < notiCmds.length; curCmdIdx++){
          let curCmdConfigs = self.cnotiMqttCommands[notiCmds[curCmdIdx]]
          for(let curCmdConfIdx = 0; curCmdConfIdx < curCmdConfigs.length; curCmdConfIdx++){
            let curCmdConf = curCmdConfigs[curCmdConfIdx]
            // {
            //   commandId: "SCREENON",
            //   mqttTopic: "magicmirror/state",
            //   mqttMsgPayload: '{"state":"ON"}',
            //   options: {"qos": 1, "retain": false},
            //   retain: true,
            //   qos: 0
            // },
            if (typeof curCmdConf.mqttTopic !== "undefined"){
              let curStringifyPayload
              if(typeof curCmdConf.stringifyPayload !== "undefined"){
                curStringifyPayload = curCmdConf.stringifyPayload
              } else {
                curStringifyPayload = self.config.stringifyPayload
              }
              let msg
              if (typeof curCmdConf.mqttMsgPayload === "undefined") {
                if(curStringifyPayload){
                  msg = JSON.stringify(payload)
                } else {
                  msg = payload
                }
              } else {
                if(curStringifyPayload){
                  msg = JSON.stringify(curCmdConf.mqttMsgPayload)
                } else {
                  msg = curCmdConf.mqttMsgPayload
                }
              }

              let curOptions = curCmdConf.options || {}
              
              if (typeof curCmdConf.retain !== "undefined"){
                curOptions["retain"] = curCmdConf.retain
              } else {
                curOptions["retain"] = self.config.mqttConfig.retain
              }
              if (typeof curCmdConf.qos !== "undefined"){
                curOptions["qos"] = curCmdConf.qos
              } else {
                curOptions["qos"] = self.config.mqttConfig.qos
              }

              self.publishNotiToMqtt(curCmdConf.mqttTopic, msg, curOptions);
            } else {
              this.sendSocketNotification("LOG","[MQTT bridge] NOTI -> MQTT error: Skipping mqtt publish cause \"mqttTopic\" is missing. " + JSON.stringify(curCmdConf));
            }
          }
        }
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
        self.cnotiHook = payload.cnotiHook;
        self.cnotiMqttCommands = payload.cnotiMqttCommands;
        self.cmqttHook = payload.cmqttHook;
        self.cmqttNotiCommands = payload.cmqttNotiCommands;
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

    if (typeof self.cnotiHook[notification] !== "undefined"){
      if (typeof payload !== "undefined"){
        self.notiToMqtt(notification, payload);
      } else {
        self.notiToMqtt(notification, "");
      }
    }
  }
  // END of NOTIFICATIONS to MQTT logic
});
