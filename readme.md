## MMM-MQTTbridge
<p align="right">
	<a href="http://choosealicense.com/licenses/mit"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

**MMM-MQTTbridge** allows you to integrate your MagicMirror into your smart home system via [MQTT protocol](https://github.com/mqtt/mqtt.github.io/wiki/software?id=software) and manage MagicMirror via MQTT messages by converting them into MM Notifications and vise verse - listen to your MM's Notifications and convert them into MQTT mesages.

So, this module for MagicMirror do the following:
1. **Listens to MQTT messages** from your MQTT broker and, if mqtt-message arrives, module **sends MM Notifications** based on the pre-configured mqtt-to-notification Dictionary rules.
2. **Listens to the MM Notifications** within your MagicMirror environment. If Notification arrives, module **sends MQTT message** based on the preconfigured notification-to-mqtt Dictionary rules. 

![MQTTbridge_logo](.github/mqttbridge_logo.png)

## USAGE

**MQTT to NOTIF**
- user configure within MM's the `mqttConfig` - its a general settings for mqtt ;
- user sets rules to convert MQTT messages into MM's NOTIFICATIONS. Rules are set in `dic/mqttDictionary.js` according to the config below;
- module subscirbes to preconfigured topics and receives the mqtt-messages;
*Example: mqtt-message with payload `VOLUME_SET:20`*
- module transforms mqtt-message into MM NOTIFICATIONS according to the `mqttDictionary` rules. *following Volume example above, module could issue Notification `VOLUME_SET` with notification payload `20`. So the volume of your MM will be changed to 20% (you need [MMM-Volume](https://github.com/eouia/MMM-Volume) to control volume via Notifications) 

**NOTIF TO MQTT**

- will be added later;


## INSTALLATION
**1. Clone and install module. Do the following commands**:
```sh
cd ~/MagicMirror/modules
git clone --depth=1 https://github.com/sergge1/MMM-MQTTbridge.git
cd MMM-MQTTbridge
npm install
```
**2. Copy to MagicMirror config.js file MQTTbridge's config section**:
- go to `cd ~/MagicMirror/config`
- open file `config.js`
- add the following config within `modules` section:

```js
{
	module: 'MMM-MQTTbridge',
	disabled: false,
	config: {
		mqttServer: "mqtt://:@localhost:1883",
		mqttConfig:
		{
			listenMqtt: true,
			useMqttBridgeFromatOnly: false,
			interval: 300000,
			topicSubscr: ["home/smartmirror/bathroom/light/set", "home/smartmirror/kitchen/light/set"],
		},
		notiConfig:
		{
			listenNoti: true,
			useMqttBridgeFromatOnly: false,
			ignoreNotiId: ["CLOCK_MINUTE", "NEWS_FEED"],
			ignoreNotiSender: ["system", "NEWS_FEED"],
		},
		// set "NOTIFICATIONS -> MQTT" dictionary at /dict/notiDictionary.js
		// set "MQTT -> NOTIFICATIONS" dictionary at /dict/mqttDictionary.js
	},
},
```

**3. Set dictionary files with your MQTT->NOTI and NOTI->MQTT rules**:
- go to `cd ~/MagicMirror/modules/MMM-MQTTbridge/dict`
- edit `notiDictionary.js` and `mqttDictionary.js` for respective rules according to the explanation below.



## CONFIG STRUCTURE
**For better understanding, we have divided config into 3 sections**:
1. General configurations in `config.js`;
2. "NOTIFICATION to MQTT" dictionary rules;
3. "MQTT to NOTIFICATION" dictionary rules;


### GENERAL SECTION

**MQTT part**
- `mqttServer`set you server address using the following format:   "mqtt://"+USERNAME+":"+PASSWORD+"@"+IPADDRESS+":"+PORT. E.g. if you are using your broker *without username/password* on *localhost* with port *1883*, you config should looks "*mqtt://:@localhost:1883*",
- `listenMqtt` - turn on/off the listening of MQTT messages. Set to `false` if you are going to use only NOTI->MQTT dictionary to save CPU usage;
- `useMqttBridgeFromatOnly` - you can use native MQTTbridge MQTT message format. It saves CPU usage. Native MQTT message format looks: "NOTIFICATION_ID:NOTIFICATION_PAYLOAD". E.g. if you want to use Native format, send the MQTT message like "VOLUME_SET:20" and the module will convert it to NOTIFICATION "VOLUME:20" without Dictionary use (save CPU usage).
- `interval` - interwal for MQTT status update, default is 300000ms.
- `topicSubscr` - list of MQTT topics, to which the module will be subscribe and receive messages. :E.g.: ["home/smartmirror/bathroom/light/set", "home/smartmirror/kitchen/light/set"],


**NOTIFICATION part**
- `listenNoti` - turn on/off the listening of NOTIFICATIONS. Set to `false` if you are going to use only MQTT->NOTI dictionary to save CPU usage;
- `useMqttBridgeFromatOnly` - - you can use native MQTTbridge NOTIFICATION format. It saves CPU usage. Native NOTIFICATION format looks: "NOTI_TO_MQTT: {mqttTopic: "", mqttPayload: ""}". E.g. if you want to use Native format, send the NOTIFICATIONS from other MM modules like "NOTI_TO_MQTT: {mqttTopic: "home/kitchen/light/set", mqttPayload: "{State:ON}" and the module will convert it to MQTT massage  to the topic "home/kitchen/light/set" with payload "{State:ON}" without Dictionary use (save CPU usage).
- `ignoreNotiId` - list your NOTIFICATION ID that should be ignored from processing, this saves CPU usage. E.g. ["CLOCK_MINUTE", "NEWS_FEED"],
- `ignoreNotiSender` - list your NOTIFICATION SENDERS that should be ignored from processing, this saves CPU usage. E.g. ["system", "NEWS_FEED"]



### NOTIFICATIONS to MQTT DICTIONARY SECTION
Should be set within `~/MagicMirror/modules/MMM-MQTTbridge/dict/notiDictionary.js`

```js
var notiHook = [
  {
    notiId: "CLOCK_SECOND",
    notiPayload: [
      {
        payloadValue: '10',
        notiMqttCmd: ["Command 1", "Command 2"]
      },
      {
        payloadValue: '20',
        notiMqttCmd: ["Command 2"]
      },
      {
        payloadValue: '30', 
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
```


### MQTT to NOTIFICATIONS DICTIONARY SECTION
Should be set within `~/MagicMirror/modules/MMM-MQTTbridge/dict/mqttDictionary.js`

```js
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
  ```
  

## TESTED ENVIRONMENT
- Raspberry Pi 3 B+;
- Clean Updated Upgarded [Raspbian Buster](https://www.raspberrypi.org/downloads/raspbian/);
- [MagicMirror](https://github.com/MichMich/MagicMirror) ^2.10.1;
- mqtt-broker [eclipse-mosquitto](https://hub.docker.com/_/eclipse-mosquitto) run in docker on the same RPi;
- mqtt-client on Windows10.


## CREDITS

[@bugsounet](https://github.com/bugsounet)

[@sergge1](https://github.com/sergge1)
