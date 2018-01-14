module.exports = function(RED) {
	
	'use strict';
	
	const STATUS_OK = {
        fill: "green",
        shape: "dot",
        text: "OK"
    };

    const STATUS_ERROR = {
        fill: "red",
        shape: "dot",
        text: "Error"
    };
	
	var unifi = require('node-unifi');
	
    function UnifiNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
		var username = node.credentials.username;
		var password = node.credentials.password;
		var site = config.site;
		var ip = config.ip;
		var port = config.port;
		var command = config.command;
		
		var controller = new unifi.Controller(ip, port);
			
        this.on('input', function(msg) {
			
			if (msg.payload.command != null) {
				command = msg.payload.command.toLowerCase();
			}
			
			controller.login(username, password, function(err) {
	
			if(err)
			{
			console.log('ERROR: ' + err);
			node.status(STATUS_ERROR);
			return;
			}
			
			if (command == '1' || command == 'sitesstats'){
				controller.getSitesStats(function(err, site_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(site_data);
					}
				});
				
			} else if (command == '10' || command == 'sitesysinfo') {
				controller.getSiteSysinfo(site, function(err, sysinfo) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(sysinfo);
					}
				});
			} else if (command == '20' || command == 'clientdevices') {
				controller.getClientDevices(site, function(err, client_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(client_data);
					}
				});
				
			} else if (command == '30' || command == 'allusers') {
				controller.getAllUsers(site, function(err, users_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(users_data);
					}
				});
			} else if (command == '40' || command == 'usergroups') {
				controller.getUserGroups(site, function(err, groups_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(groups_data);
					}
				});
			} else if (command == '50' || command == 'health') {
				controller.getHealth(site, function(err, health_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(health_data);
					}
				});
			} else if (command == '60' || command == 'dashboard') {
				controller.getDashboard(site, function(err, dashboard_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(dashboard_data);
					}
				});
			}  else if (command == '70' || command == 'accessdevices') {
				controller.getAccessDevices(site, function(err, accessdevices_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(accessdevices_data);
					}
				});
			} else if (command == '80' || command == 'rogueaccesspoints') {
				controller.getRogueAccessPoints(site, function(err, rogue_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(rogue_data);
					}
				});
			}  else if (command == '90' || command == 'events') {
				controller.getEvents(site, function(err, events_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(events_data);
					}
				});
			}  else if (command == '100' || command == 'alarms') {
				controller.getAlarms(site, function(err, alarms_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(alarms_data);
					}
				});
			} else if (command == '110' || command == 'wlansettings') {
				controller.getWLanSettings(site, function(err, wlansettings_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(wlansettings_data);
					}
				});
			} else if (command == 'disablewlan') {
				controller.disableWLan(site, msg.payload.wlan_id, msg.payload.disable, function(err, disableWLan_data) {
					if(err)
					{
					console.log('ERROR: ' + err);
					node.status(STATUS_ERROR);
					return;
					} else {
					sendData(disableWLan_data);
					}
				});
			} else {
				controller.logout();
				node.status(STATUS_ERROR);
				return;		
			}
			
			function sendData(data) {
				controller.logout();	
				msg.payload = data;
				node.send(msg);
				node.status(STATUS_OK);         
			}
		});
		});
    }
	RED.nodes.registerType("Unifi",UnifiNode,{
     credentials: {
         username: {type:"text"},
         password: {type:"password"}
     }
 });
}