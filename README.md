node-red-contrib-unifi is a Node-RED module that allows to query/control [UniFi devices](http://www.ubnt.com/) via the official UniFi-Controller API. Based on npm package node-unifi

## Supports the following Commands
* SitesStats : Site stats
* SiteSysinfo : Site sysinfo
* ClientDevices : Online client device(s)
* AllUsers : All client devices ever connected to the site
* UserGroups : User groups
* Health : Health metrics
* Dashboard : Dashboard metrics
* AccessDevices : Access points
* RogueAccessPoints : Rogue access points
* Events : Events
* Alarms : Alarms
* WLanSettings : WLan Settings

## Special Commands: (No GUI)
* disableWLan : Disable/Enable WLan { command: "disableWLan", wlan_id: "use _id from command WLanSettings", disable: true }
* blockClient : Block Client { command: "blockClient", mac: "client MAC address" }
* unblockClient : Unblock Client { command: "unblockClient", mac: "client MAC address" }
* reconnectClient : Reconnect Client { command: "reconnectClient", mac: "client MAC address" }
* authorizeGuest : Authorize Client { command: "authorizeGuest", mac: "client MAC address", minutes: "minutes until authorization expires" }   
* unauthorizeGuest : Unauthorize Client { command: "unauthorizeGuest", mac: "client MAC address" }
* site : Connect to site name { site: "site name"}

## Tips
* Use the command SiteStats to get your Unifi Site Name	
* Use msg.payload = { site: "site name"}; to add the site name dynamically

## Requirements
* Installed [UniFi-Controller](https://www.ubnt.com/download/unifi) version v4 or v5
* Unifi controller user must have at least 'administrator' rights (not read-only)

## Installation recommended
The recommended way to install this module is from the Node-RED GUI itself.
Menu/manage palette/Install/search for unifi and then click install.

## Installation manual
If Node-RED has been installed according to the instructions on https://nodered.org/docs/getting-started/installation, 
then the installation command for node-red-contrib-unifi has to be done from inside the Node-RED 
user-directory (default $HOME/.node-red) and prefixed with sudo.

## License
MIT License

Copyright (c) 2017 Kristoffer Isaksson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
