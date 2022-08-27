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

        var server = RED.nodes.getNode(config.server);
        if (!server) {
            this.error(RED._('missing client config'));
            return;
        }

        let { username, password, site, ip, port, unifios, ssl } = server;
        let { command } = config;

        const controller = new unifi.Controller(ip, port, unifios, ssl);

        this.on('input', function (msg) {

            if (msg.payload.command != null) {
                command = msg.payload.command;
            } else {
                command = config.command;
            }

            if (msg.payload.site != null) {
                site = msg.payload.site;
            } else {
                site = server.site;
            }


            controller.login(username, password, (err, data) => {

                if (err) {
                    console.log('ERROR: ' + err.message);
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: err.message
                    });
                    return;
                }



                switch (command.toString().toLowerCase()) {
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
                    case '35':
                    case 'allblockedusers':
                        controller.getBlockedUsers(site, handleDataCallback);
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
                        controller.getEvents(site, handleDataCallback, msg.payload.historyhours, msg.payload.start, msg.payload.limit);
                        break;
                    case '100':
                    case 'alarms':
                        controller.getAlarms(site, handleDataCallback);
                        break;
                    case '110':
                    case 'wlansettings':
                        controller.getWLanSettings(site, handleDataCallback);
                        break;
                    case '120':
                    case 'listportprofiles':
                        controller.getPortConfig(site, handleDataCallback);
                        break;
                    case '130':
                    case 'portforwardsettings':
                        controller.getPortForwardSettings(site, handleDataCallback);
                        break;
                    case 'disablewlan':
                        controller.disableWLan(site, msg.payload.wlan_id, msg.payload.disable, handleDataCallback);
                        break;
                    case 'disableportforward':
                        controller.disablePortForward(site, msg.payload.portforward_id, msg.payload.disable, handleDataCallback);
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
                        controller.disableAccessPoint(site, msg.payload.device_id, false, handleDataCallback);
                        break;
                    case 'disableap':
                        controller.disableAccessPoint(site, msg.payload.device_id, true, handleDataCallback);
                        break;
                    case 'setapled':
                        controller.setLEDOverride(site, msg.payload.device_id, msg.payload.mode, handleDataCallback);
                        break;
                    case 'setsiteled':
                        controller.setSiteLEDs(site, msg.payload.mode, handleDataCallback);
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
                    case 'getfirewallrules':
                        controller.getFirewallRules(site, handleDataCallback);
                        break;
                    case 'getfirewallrule':
                        controller.getFirewallRule(site, msg.payload.rule_id, handleDataCallback);
                        break;
                    case 'getfirewallrulebyname':
                        controller.getFirewallRuleByName(site, msg.payload.rule_name, handleDataCallback);
                        break;
                    case 'enablefirewallrule':
                        controller.disableFirewallRule(site, msg.payload.rule_id, true, handleDataCallback);
                        break;
                    case 'disablefirewallrule':
                        controller.disableFirewallRule(site, msg.payload.rule_id, false, handleDataCallback);
                        break;
                    case 'getpoeportstate':
                        controller.getPoePortState(site, msg.payload.device_id, msg.payload.port, handleDataCallback);
                        break;
                    case 'enablepoeport':
                        controller.disablePoePort(site, msg.payload.device_id, msg.payload.port, msg.payload.poe_mode, handleDataCallback);
                        break;
                    case 'disablepoeport':
                        controller.disablePoePort(site, msg.payload.device_id, msg.payload.port, 'off', handleDataCallback);
                        break;
                    case 'forceprovision':
                        controller.forceProvision(site, msg.payload.mac, handleDataCallback);
                        break;
                    case 'setportprofiles':
                        controller.setPortProfiles(site, msg.payload.device_id, msg.payload.port_overrides, handleDataCallback);
                        break;
                    case 'setlocate':
                        controller.setLocateAccessPoint(site, msg.payload.mac, true, handleDataCallback);
                        break;
                    case 'unsetlocate':
                        controller.setLocateAccessPoint(site, msg.payload.mac, false, handleDataCallback);
                        break;
                    case 'setoutletportstate':
                        controller.setOutletPortState(site, msg.payload.mac, msg.payload.index, msg.payload.relay_state, msg.payload.cycle_enabled, handleDataCallback);
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
                    msg.error = err.message;
                    node.send(msg);
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

    function unifiConfigNode(n) {
        RED.nodes.createNode(this, n);

        this.name = n.name;
        this.ip = n.ip;
        this.port = n.port;
        this.site = n.site;
        this.unifios = n.unifios;
        this.ssl = n.ssl;
        this.username = this.credentials.username;
        this.password = this.credentials.password;
    }

    RED.nodes.registerType("unificonfig", unifiConfigNode, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });

    RED.nodes.registerType("Unifi", UnifiNode);
};
