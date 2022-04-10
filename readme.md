## MMM-MQTTbridge
<p align="right">
	<a href="http://choosealicense.com/licenses/mit"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

**MMM-MQTTbridge** allows you to integrate your MagicMirror into your smart home system via [MQTT protocol](https://github.com/mqtt/mqtt.github.io/wiki/software?id=software) and manage MagicMirror via MQTT messages by converting them into MM Notifications and vise verse - listen to your MM's Notifications and convert them into MQTT mesages.

So, this module for MagicMirror do the following:
1. **Listens to MQTT messages** from your MQTT broker and, if mqtt-message arrives, module **sends MM Notifications** based on the pre-configured mqtt-to-notification Dictionary rules.
2. **Listens to the MM Notifications** within your MagicMirror environment. If Notification arrives, module **sends MQTT message** based on the preconfigured notification-to-mqtt Dictionary rules. 

![MQTTbridge_logo](.github/mqttbridge_logo.png)

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
			interval: 300000,
		},
		notiConfig:
		{
			listenNoti: true,
			ignoreNotiId: ["CLOCK_MINUTE", "NEWS_FEED"],
			ignoreNotiSender: ["system", "NEWS_FEED"],
		},
		// set "NOTIFICATIONS -> MQTT" dictionary at /dict/notiDictionary.js
		// set "MQTT -> NOTIFICATIONS" dictionary at /dict/mqttDictionary.js
	},
},
```

If you like to use a tls encrypted connection to your server you can use this example configuration:
```js
{
	module: 'MMM-MQTTbridge',
	disabled: false,
	config: {
		mqttServer: "mqtts://:@localhost:8883",
		mqttConfig:
		{
			listenMqtt: true,
			interval: 300000,
      mqttClientKey: "/home/pi/client-key.pem",
			mqttClientCert: "/home/pi/client-cert.pem",
			caCert: "/home/pi/ca-cert.pem",
			rejectUnauthorized: true,
		},
		notiConfig:
		{
			listenNoti: true,
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
- `mqttServer` - set you server address using the following format:   "mqtt://"+USERNAME+":"+PASSWORD+"@"+IPADDRESS+":"+PORT or "mqtts://"+USERNAME+":"+PASSWORD+"@"+IPADDRESS+":"+PORT. E.g. if you are using your broker with plaintext connnection *without username/password* on *localhost* with port *1883*, you config should looks "*mqtt://:@localhost:1883*",
- `mqttClientKey`- specify the path of the client tls key file (mandatory if using tls connetion). i.e. "/home/pi/client-key.pem";
- `mqttClientCert` - specify the path of the client tls certificate file (mandatory if using tls connection). i.e. "/home/pi/client-cert.pem";
- `caCert` - specify the path of the CA tls certificate file (mandatory if using tls connection). i.e. "/home/pi/ca-cert.pem";
- `rejectUnauthorized`: specify if a self-signed server certificate should be rejected, default is true;
- `listenMqtt` - turn on/off the listening of MQTT messages. Set to `false` if you are going to use only NOTI->MQTT dictionary to save CPU usage;
- `interval` - interwal for MQTT status update, default is 300000ms.


**NOTIFICATION part**
- `listenNoti` - turn on/off the listening of NOTIFICATIONS. Set to `false` if you are going to use only MQTT->NOTI dictionary to save CPU usage;
- `ignoreNotiId` - list your NOTIFICATION ID that should be ignored from processing, this saves CPU usage. E.g. ["CLOCK_MINUTE", "NEWS_FEED"],
- `ignoreNotiSender` - list your NOTIFICATION SENDERS that should be ignored from processing, this saves CPU usage. E.g. ["system", "NEWS_FEED"]



### NOTIFICATIONS to MQTT DICTIONARY SECTION
Should be set within `~/MagicMirror/modules/MMM-MQTTbridge/dict/notiDictionary.js`

If payloadValue is empty, the actual payload of the notification will be used as MQTT payload.
If payloadValue is specified and matches the payload received via the notification, mqttMsgPayload will be used as MQTT payload. 

**Please note, if your Noti issues boolean values (e.g. true/false) - you need to paste into notiDict 1 or 0 for true/false**.

```js
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
    mqttTopic: "myhome/kitchen/temperature",
    mqttMsgPayload: ''
  },
];
```


### MQTT to NOTIFICATIONS DICTIONARY SECTION
Should be set within `~/MagicMirror/modules/MMM-MQTTbridge/dict/mqttDictionary.js`

If payloadValue is empty, the actual payload of the MQTT message will be used as notification payload.
If payloadValue is specified and matches the payload received via MQTT, notiPayload will be used as notification payload. 

```js
var mqttHook = [
    {
      mqttTopic: "myhome/test",
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
      mqttTopic: "myhome/test2",
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
  ```
  

## CREDITS

[@bugsounet](https://github.com/bugsounet)

[@sergge1](https://github.com/sergge1)

[@DanielHfnr](https://github.com/DanielHfnr)
