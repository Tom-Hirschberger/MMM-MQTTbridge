## MMM-MQTTbridge
<p align="right">
	<a href="http://choosealicense.com/licenses/mit"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

**MMM-MQTTbridge** allows you to integrate your MagicMirror into your smart home system via [MQTT protocol](https://github.com/mqtt/mqtt.github.io/wiki/software?id=software) and manage MagicMirror via MQTT messages by converting them into MM Notifications and vise verse - listen to your MM's Notifications and convert them into MQTT mesages.

So, this module for MagicMirror do the following:
1. **Listens to MQTT messages** from your MQTT broker and, if mqtt-message arrives, module **sends MM Notifications** based on the pre-configured mqtt-to-notification Dictionary rules.
2. **Listens to the MM Notifications** within your MagicMirror environment. If Notification arrives, module **sends MQTT message** based on the preconfigured notification-to-mqtt Dictionary rules. 

![addons Logo](.github/mqttbridge_logo1.png)

## USAGE

**MQTT to NOTIF**
- user configure the `topicSubscr` - its a single or array of mqtt-topics which will be listened by the module;
- user configure the rules `mqttDictionary` in mqttDictionary according to the config below;
- module receives the mqtt-messages with the following payload `{NOTIFICATION_NAME:NOTIFICATION_PAYLOAD}`. NOTIFICATION_PAYLOAD could be a null, string, a number or a object (array). 
*Example: mqtt-message with payload `VOLUME_SET:20`*
- module transforms mqtt-message into MM NOTIFICATIONS according to the `mqttDictionary` rules. *following Volume example above, module will issue Notification `VOLUME_SET` with notification payload `20`. So the volume of your MM will be changed to 20% (you need [MMM-Volume](https://github.com/eouia/MMM-Volume) to control volume via Notifications) 

**NOTIF TO MQTT**

- will be added later;

## CONFIG STRUCTURE

For better understanding, we have divided config into 3 sections:
1. general configuration (like server address, reload interval etc) section;
2. MQTT to NOTIFICATION dictionary section;
3. MQTT to NOTIFICATION dictionary section;

### GENERAL SECTION

```js
debug: true,
mqttServer: 'mqtt://:@localhost:1883', 
    // serverMqtt: localhost , 
    // portMqtt: 1883,
    // userMqtt: "",
    // passMqtt: "",
    // listenMqtt: true,   // turn on/off listening of mqtt-messages and sending them as NOTIF
    // listenNotif: true,   // turn on/off listening of NOTIF and sending them as mqt-messages
topicSubscr: ['home/smartmirror/led/set', 'home/smartmirror/bathroom/light/set'], //default topics for receiving messages over mqtt. could be an array of topics
    // topicSend: [home/smartmirror/mqtt_mm/set],  //default topic to send messages from NOTIF to mqtt which are not in notifDictionary; could be array of topics.
    // mqttOnlyDict: false,  //if true - to send mqtt-messages only if they included in Dictionary. If false - to send matt-messages according to the rules in Dict AND for those mqtt-message which are not in the Dict rules - send their payload to defaultTopic;
    // notifOnlyDict: false, //if true - to send notifications only if they are included in Dictionary. If false - to send NOTIF according to the rules in Dict AND for those NOTIF which are not in the Dict rules - send as NOTIF:PAYLOAD.
interval: 300000,
publications: [],

// MQTT to NOTIFICATIONS DICTIONARY HERE

// NOTIFICATIONS to MQTT DICTIONARY HERE

// END OF CONFIG
```

### MQTT to NOTIFICATIONS DICTIONARY SECTION

```js
mqttDictionary: [  // you can defined different NOTIFICATIONS here based on the mqttNOTIFICATION and mqttPYALOAD
      {
        mqttNotif: "ASSISTANT_LISTEN", //if MQTT message starts with "CLOCK_MINUTE", the module will do further
        mqttPayload: [
          {
            payloadValue: "0", // if the MQTT message's second part '{...:20}' the module will send the notifications according to the rules in the array `notifications` below.
            sendNotif: true, //if this is false, NOTIFICATIONS will not be send if the occurence `mqttNotif` and `payloadValue` will be found;
            notifications: [ // array of notifications
              {
                notif: 'ASSISTANT_LISTEN',     // NOTIF #1
//                notifDelay: 0, //if you want some timeout between mqtt_received and sending NOTIF. UNDER DEVELOPMENT
                notifPayload: '0' // payload of your NOTIFICATION
              },
              {
                notif: 'NEWS_FEED',     // NOTIF #2
                notifDelay: 0,
                notifPayload: 'www.kukuyopta.com'
              },
            ],
          },
      },
],
```

### MQTT to NOTIFICATIONS DICTIONARY SECTION - UNDER DEVELOPMENT

```js
notifDictionary: [ // you can defined different MQTT messages here based on the NOTIFICATION and PAYLOAD
      {
        notification: "CLOCK_MINUTE",
        payload: "20", // so if MM issues notification "CLOCK_MINUTE" with payload "20", the mqtt-messages should be sent to the topics - could be a list of such messages like in example further: 2 topics/messages)
        sendMessage: true, //possible values "true" - so execute mqtt-send, "false" - do nothing (parameter needed to make exception for some specific notig;
        mqttMessages: [
          {
            mqttTopic: 'home/smartmirror/led/set',
            messageDelay: 0, //if you want some timeout between NOTIF received and sending mqtt-messages 
            messagePayload: '{STATE:ON, COLOR: {"r":255,"g":255,"b":$payload$}}' // $payload$ means that mqtt-message payload should include actual payload from notification, so the color "b" shold be sent as "20"
          },
          {
            mqttTopic: 'home/smartmirror/audio/set',
            messageDelay: 0,
            messagePayload: '{CMD:TURN_ON}'
          },
        ]
      },
],
```

## TESTED ENVIRONMENT
- Raspberry Pi 3 B+;
- Clean Updated Upgarded [Raspbian Buster](https://www.raspberrypi.org/downloads/raspbian/);
- [MagicMirror](https://github.com/MichMich/MagicMirror) ^2.10.1;
- mqtt-broker [eclipse-mosquitto](https://hub.docker.com/_/eclipse-mosquitto) run in docker on the same RPi;
- mqtt-client on Windows10.
