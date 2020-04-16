/**  mqtt-to-notification                     **/
/**  dictionaty                               **/
/**  for MMM-MQTTbridge module                **/
/**  modify comands                           **/
/**         @sergge1                          **/


var notiHook = [
  {
    notiId: "CLOCK_SECOND",
    notiPayload: [
      {
        payloadValue: '10', 
        notiMqttCmd: ["Command 1"]
      },
    ],
  },
  {
    notiId: "INDOOR_TEMPERATURE",
    notiPayload: [
      {
        payloadValue: '', 
        notiMqttCmd: ["Command 2"]
      },
    ],
  },
];
var notiMqttCommands = [
  {
    commandId: "Command 1",
    mqttTopic: "myhome/kitchen/light/set",
    mqttMsgPayload: '{"state":"OFF"}'
  },
  {
    commandId: "Command 2",
    mqttTopic: "myhome/kitchen/light/set",
    mqttMsgPayload: ''
  },
];

module.exports = { notiHook, notiMqttCommands };