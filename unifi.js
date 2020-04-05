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

        function handleDataCallback(err, data) {
            if (err) {
                console.log('ERROR: ' + err);
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: err
                });

            } else {
                controller.logout();
                msg.payload = data;
                node.send(msg);
                node.status(STATUS_OK);
            }
        }

        const matchCaseInsensitive = (a, b) => a.toLowerCase() === b.toLowerCase();

        this.on('input', function (msg) {

            if (msg.payload.command != null) {
                command = msg.payload.command.toLowerCase();
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

                if (command === '1' || matchCaseInsensitive('sitesstats')) {
                    controller.getSitesStats(handleDataCallback);
                } else if (command === '10' || matchCaseInsensitive('sitesysinfo')) {
                    controller.getSiteSysinfo(site, handleDataCallback);
                } else if (command === '20' || matchCaseInsensitive('clientdevices')) {
                    controller.getClientDevices(site, handleDataCallback);
                } else if (command === '30' || matchCaseInsensitive('allusers')) {
                    controller.getAllUsers(site, handleDataCallback);
                } else if (command === '40' || matchCaseInsensitive('usergroups')) {
                    controller.getUserGroups(site, handleDataCallback);
                } else if (command === '50' || matchCaseInsensitive('health')) {
                    controller.getHealth(site, handleDataCallback);
                } else if (command === '60' || matchCaseInsensitive('dashboard')) {
                    controller.getDashboard(site, handleDataCallback);
                } else if (command === '70' || matchCaseInsensitive('accessdevices')) {
                    controller.getAccessDevices(site, handleDataCallback);
                } else if (command === '80' || matchCaseInsensitive('rogueaccesspoints')) {
                    controller.getRogueAccessPoints(site, handleDataCallback);
                } else if (command === '90' || matchCaseInsensitive('events')) {
                    controller.getEvents(site, handleDataCallback);
                } else if (command === '100' || matchCaseInsensitive('alarms')) {
                    controller.getAlarms(site, handleDataCallback);
                } else if (command === '110' || matchCaseInsensitive('wlansettings')) {
                    controller.getWLanSettings(site, handleDataCallback);
                } else if (matchCaseInsensitive('disablewlan')) {
                    controller.disableWLan(site, msg.payload.wlan_id, msg.payload.disable, handleDataCallback);
                } else if (matchCaseInsensitive('blockclient')) {
                    controller.blockClient(site, msg.payload.mac, handleDataCallback);
                } else if (matchCaseInsensitive('unblockclient')) {
                    controller.unblockClient(site, msg.payload.mac, handleDataCallback);
                } else if (matchCaseInsensitive('reconnectclient')) {
                    controller.reconnectClient(site, msg.payload.mac, handleDataCallback);
                } else if (matchCaseInsensitive('unauthorizeguest')) {
                    controller.unauthorizeGuest(site, msg.payload.mac, handleDataCallback);
                } else if (matchCaseInsensitive('authorizeguest')) {
                    controller.authorizeGuest(site, msg.payload.mac, msg.payload.minutes, handleDataCallback);
                } else if (matchCaseInsensitive('restartAP')) {
                    controller.rebootAccessPoint(site, msg.payload.mac, handleDataCallback);
                } else {
                    controller.logout();
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "No command"
                    });

                }


            });
        });
    }

    RED.nodes.registerType("Unifi", UnifiNode, {
        credentials: {
            username: {type: "text"},
            password: {type: "password"}
        }
    });
};
