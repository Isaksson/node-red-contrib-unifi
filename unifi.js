module.exports = function (RED) {

    'use strict';

    const STATUS_OK = {
        fill: "green",
        shape: "dot",
        text: "OK"
    };

    const unifi = require('./unifi-helper');

    function UnifiNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const {username, password} = node.credentials;
        let {site, ip, port, command, unifios} = config;

        const controller = new unifi.Controller(ip, port, unifios);

        this.on('input', function (msg) {

            if (msg.payload.command != null) {
                command = msg.payload.command.toString().toLowerCase();
            }

            if (msg.payload.site != null) {
                site = msg.payload.site;
            }

            controller.login(username, password, (err) => {

                if (err) {
                    console.log('ERROR: ' + err);
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: err
                    });
                    return;
                }

                switch(command.toLowerCase()){
                    case '1':
                    case 'sitestats':
                        controller.getSitesStats(handleDataCallback);
                        break;
                    case '10':
                    case 'sitesysinfo':
                        controller.getSiteSysinfo(site, handleDataCallback);
                        break;
                    case '20':
                    case 'clientdevices':
                        controller.getClientDevices(site, handleDataCallback);
                        break;
                    case '30':
                    case 'allusers':
                        controller.getAllUsers(site, handleDataCallback);
                        break;
                    case '40':
                    case 'usergroups':
                        controller.getUserGroups(site, handleDataCallback);
                        break;
                    case '50':
                    case 'health':
                        controller.getHealth(site, handleDataCallback);
                        break;
                    case '60':
                    case 'dashboard':
                        controller.getDashboard(site, handleDataCallback);
                        break;
                    case '70':
                    case 'accessdevices':
                        controller.getAccessDevices(site, handleDataCallback);
                        break;
                    case '80':
                    case 'rogueaccesspoints':
                        controller.getRogueAccessPoints(site, handleDataCallback);
                        break;
                    case '90':
                    case 'events':
                        controller.getEvents(site, handleDataCallback);
                        break;
                    case '100':
                    case 'alarms':
                        controller.getAlarms(site, handleDataCallback);
                        break;
                    case '110':
                    case 'wlansettings':
                        controller.getWLanSettings(site, handleDataCallback);
                        break;
                    case 'disablewlan':
                        controller.disableWLan(site, msg.payload.wlan_id, msg.payload.disable, handleDataCallback);
                        break;
                    case 'blockclient':
                        controller.blockClient(site, msg.payload.mac, handleDataCallback);
                        break;
                    case 'unblockclient':
                        controller.unblockClient(site, msg.payload.mac, handleDataCallback);
                        break;
                    case 'reconnectclient':
                        controller.reconnectClient(site, msg.payload.mac, handleDataCallback);
                        break;
                    case 'unauthorizeguest':
                        controller.unauthorizeGuest(site, msg.payload.mac, handleDataCallback);
                        break;
                    case 'authorizeguest':
                        controller.authorizeGuest(site, msg.payload.mac, msg.payload.minutes, handleDataCallback);
                        break;
                    case 'restartap':
                        controller.rebootAccessPoint(site, msg.payload.mac, handleDataCallback);
                        break;
                    case 'enableap':
                        controller.disableAccessPoint(site, msg.payload.mac, false, handleDataCallback);
                        break;
                    case 'disableap':
                        controller.disableAccessPoint(site, msg.payload.mac, true, handleDataCallback);
                        break;
                    case 'setapled':
                        controller.setLEDOverride(site, msg.payload.device_id, msg.payload.mode, handleDataCallback);
                        break;
                    case 'getfirewallgroups':
                        controller.getFirewallGroups(site, handleDataCallback);
                        break;
                    case 'editfirewallgroup':
                        controller.editFirewallGroup(site, msg.payload.group_id, msg.payload.site_id, msg.payload.group_name, msg.payload.group_type, handleDataCallback, msg.payload.group_members);
                        break;
                    case 'addfirewallgroup':
                        controller.addFirewallGroup(site, msg.payload.group_name, msg.payload.group_type, handleDataCallback, msg.payload.group_members);
                        break;
                    case 'deletefirewallgroup':
                        controller.deleteFirewallGroup(site, msg.payload.group_id, handleDataCallback);
                        break;
                    default:
                        controller.logout();
                        node.status({
                            fill: "red",
                            shape: "dot",
                            text: "No command"
                        });
                        break;
                }

            });

            function handleDataCallback(err, data) {
                if (err) {
                    console.log('ERROR: ' + err.message);
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: err.message
                    });
    
                } else {
                    controller.logout();
                    msg.payload = data;
                    node.send(msg);
                    node.status(STATUS_OK);
                }
            }
        });
    }

    RED.nodes.registerType("Unifi", UnifiNode, {
        credentials: {
            username: {type: "text"},
            password: {type: "password"}
        }
    });
};
