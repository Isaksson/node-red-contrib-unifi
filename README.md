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
* WlanSettings : Wlan Settings
* ListPortProfiles : List Port Profiles

## Special Commands: (No GUI)
* disableWlan : Disable/Enable Wlan { command: "disableWlan", wlan_id: "use _id from command WlanSettings", disable: true }
* blockClient : Block Client { command: "blockClient", mac: "client MAC address" }
* unblockClient : Unblock Client { command: "unblockClient", mac: "client MAC address" }
* reconnectClient : Reconnect Client { command: "reconnectClient", mac: "client MAC address" }
* authorizeGuest : Authorize Client { command: "authorizeGuest", mac: "client MAC address", minutes: "minutes until authorization expires" }   
* unauthorizeGuest : Unauthorize Client { command: "unauthorizeGuest", mac: "client MAC address" }
* restartAP : Reboot an Access point { command: "restartAP", mac: "device MAC address" }
* enableAP : Enable an Access point { command: "enableAP", device_id: "24 char device id" }
* disableAP : Disable an Access point { command: "disableAP", device_id: "24 char device id" }
* setAPLed : Set LED for Access point { command: "setapled", device_id: "24 char device id", mode: "off/on/default" }
* site : Connect to site name { site: "site name"}
* getFirewallGroups: Get list of firewall groups { command: "getFirewallGroups" }
* addFirewallGroup: Add firewall group { command: "addFirewallGroup", group_name: "group-name", group_type: "address-group|ipv6-address-group|port-group", group_members: ["CIDRs", "IPs"] }
* editFirewallGroup: Edit firewall group { command: "editFirewallGroup", group_id: "group id", group_name: "group-name", group_type: "address-group|ipv6-address-group|port-group", group_members: ["CIDRs", "IPs"] }
* deleteFirewallGroup: Delete firewall group { command: "deleteFirewallGroup", group_id: "group id" }
* forceProvision : Force provision { command: "forceProvision", mac: "device MAC address" }
* !! Will remove manual set Profiles !! setPortProfile : Set Port Profile { command: "setPortProfile", device_id: "24 char device id", profile_id: "Profile id", port_id: "Port number" }
* setPortProfiles: Set overrides for multiple ports of a device { command: "setPortProfiles", device_id: "24 char device id", port_overrides: [ {"port_idx": 1, "portconf_id": "id of the port profile", "name": "friendly name of the port", "poe_mode": "off|auto" }, ... ] }
* setLocate : Enable flash device LED (or other indication based on device) { command: "setLocate", mac: "device MAC address" }
* unsetLocate : Disable flash device LED (or other indication based on device) { command: "unsetLocate", mac: "device MAC address" }

## Tips
* Use the command SiteStats to get your Unifi Site Name	
* Use msg.payload = { site: "site name"}; to add the site name dynamically
* Use the command AccessDevices to get an Access Points Device ID
* Use the command ListPortProfile to get Profile ID

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
