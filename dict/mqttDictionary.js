
var mqttHook = [
    {
      mqttTopic: "dahoam/test",
      mqttPayload: [
        {
          payloadValue: "ASSISTANT_LISTEN",
          mqttNotiCmd: ["Command 1"]
        },
        {
          payloadValue: "",
          mqttNotiCmd: ["Command 2"]
        },
      ],
    },
    {
      mqttTopic: "dahoam/test2",
      mqttPayload: [
        {
          payloadValue: "",
          mqttNotiCmd: ["Command 2"]
        },
      ],
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