/**  mqtt-to-notification                     **/
/**  dictionaty                               **/
/**  for MMM-MQTTbridge module                **/
/**  modify comands                           **/
/**         @sergge1                          **/

var mqttHook = [
    {
      mqttPayload: "ASSISTANT_LISTEN",
      mqttNotiCmd: ["Command 1", "Command 2"]
    },
  ];
var mqttNotiCommands = [
    {
      commandId: "Command 1",
      notiID: "ASSISTANT_LISTEN",
      notiPayload: 'BLABLABLA'
    },
    {
      commandId: "Command 2",
      notiID: "ASSISTANT_LISTEN",
      notiPayload: 'KUKUYOPTA'
    },
  ];

  module.exports = { mqttHook,  mqttNotiCommands};