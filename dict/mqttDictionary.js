/**  mqtt-to-notification                     **/
/**  dictionaty                               **/
/**  for MMM-MQTTbridge module                **/
/**  modify comands                           **/
/**         @sergge1                          **/

var mqttHook = [
    {
      mqttPayload: "ASSISTANT_LISTEN",
      mqttNotiCmd: ["Command 1"]
    },
    {
      mqttPayload: "ASSISTANT_SPEAK",
      mqttNotiCmd: ["Command 2"]
    },
    {
      mqttPayload: "ASSISTANT_NOTHING",
      mqttNotiCmd: ["Command 1", "Command 2"]
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
      notiPayload: 'BLABLABLA-2'
    },
  ];

  module.exports = { mqttHook,  mqttNotiCommands};