/**  mqtt-to-notification                     **/
/**  dictionaty                               **/
/**  for MMM-MQTTbridge module                **/
/**  modify comands                           **/
/**         @sergge1                          **/

var mqttHook = [
    {
      mqttTopic: "dahoam/test",
      mqttPayload: "ASSISTANT_LISTEN",
      mqttNotiCmd: ["Command 1"]
    },
    {
      mqttTopic: "dahoam/test2",
      mqttPayload: "",
      mqttNotiCmd: ["Command 2"]
    },
  ];
var mqttNotiCommands = [
    {
      commandId: "Command 1",
      notiID: "ASSISTANT_LISTEN",
      notiPayload: 'BLABLABLA-1'
    },
    {
      commandId: "Command 2",
      notiID: "ASSISTANT_LISTEN",
      notiPayload: ''
    },
  ];

  module.exports = { mqttHook,  mqttNotiCommands};