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
        payloadValue: '10', // so if MM issues notification "CLOCK_MINUTE" with payload "20", the mqtt-messages should be sent to the topics - could be a list of such messages like in example further: 2 topics/messages)
        notiMqttCmd: ["Command 1", "Command 2"]
      },
      {
        payloadValue: '20', // so if MM issues notification "CLOCK_MINUTE" with payload "20", the mqtt-messages should be sent to the topics - could be a list of such messages like in example further: 2 topics/messages)
        notiMqttCmd: ["Command 2"]
      },
      {
        payloadValue: '30', // so if MM issues notification "CLOCK_MINUTE" with payload "20", the mqtt-messages should be sent to the topics - could be a list of such messages like in example further: 2 topics/messages)
        notiMqttCmd: ["Command 1", "Command 2"]
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
    mqttMsgPayload: '{"state":"ON"}'
  },
];

module.exports = { notiHook, notiMqttCommands };