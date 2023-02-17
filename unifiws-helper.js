const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');
const WebSocket = require('ws');

var ControllerWS = function (hostname, port, unifios, ssl, username, password, site) {

    var _self = this;
    _self._cookieJar = new CookieJar();
    _self._unifios = unifios;
    _self._ssl = ssl;
    _self._baseurl = 'https://127.0.0.1:8443';
    _self._username = username;
    _self._password = password;
    _self._site = site;

    if (typeof (hostname) !== 'undefined' && typeof (port) !== 'undefined') {
        _self._baseurl = 'https://' + hostname + ':' + port;
    }

    const jar = _self._cookieJar;
    const axiosinstance = axios.create({
        httpAgent: new HttpCookieAgent({ cookies: { jar } }),
        httpsAgent: new HttpsCookieAgent({ cookies: { jar }, rejectUnauthorized: _self._ssl, requestCert: true })
    });

    _self.loginws = async function (cb) {

        if (_self._unifios)
            url = _self._baseurl + '/api/auth/login';
        else
            url = _self._baseurl + '/api/login';

        axiosinstance.post(url, {
            username: _self._username,
            password: _self._password
        })
            .then(function (response) {
                if (response.headers['x-csrf-token']) {
                    axiosinstance.defaults.headers.common['x-csrf-token'] = response.headers['x-csrf-token'];
                }
                console.log('OK');
                //console.log(response);
            })
            .catch(function (error) {
                console.log('Error');
                //console.log(error);
            })
            .then(function () {

                jar.getCookieString(_self._baseurl).then(cookies => {
                    console.log(cookies);

                    const baseurl = _self._baseurl.replace('https://', 'wss://')
                    var eventsUrl = baseurl + '/wss/s/<SITE>/events'.replace('<SITE>', _self._site);
                    if (_self._unifios)
                        eventsUrl = baseurl + '/proxy/network/wss/s/<SITE>/events'.replace('<SITE>', _self._site);

                    console.log(eventsUrl);

                    _ws = new WebSocket(eventsUrl, {
                        perMessageDeflate: false,
                        rejectUnauthorized: _self._ssl,
                        headers: {
                            Cookie: cookies
                        }
                    });

                    _ws.on('open', function open() {
                        //ws.send('something');
                        console.log('Open WS');
                        if (typeof (cb) === 'function') {
                            cb(false, 'STATUS_CONNECTED');
                        }
                    });

                    _ws.on('message', function message(data) {
                        var obj = JSON.parse(data);

                        /*

                        wu.connected - Wireless User connected
                        wu.disconnected - Wireless User disconnected
                        wu.roam - Wireless User roamed from one AP to another
                        wu.roam_radio - Wireless User changed channel on the same AP

                        wg.connected - Wireless Guest connected
                        wg.disconnected - Wireless Guest disconnected
                        wg.roam - Wireless Guest roamed from one AP to another
                        wg.roam_radio - Wireless Guest changed channel on the same AP
                        wg.authorization_ended - Wireless Guest became unauthorised

                        {
  "EVT_AD_AutoBackupFailedCloudKeySDCardNotFound": "EVT_AD_AUTO_BACKUP_FAILED_CLOUD_KEY_SD_CARD_NOT_FOUND",
  "EVT_AD_GuestAuthorizedFor": "EVT_AD_GUEST_AUTHORIZED_FOR",
  "EVT_AD_GuestExtended": "EVT_AD_GUEST_EXTENDED",
  "EVT_AD_GuestUnauthorized": "EVT_AD_GUEST_UNAUTHORIZED",
  "EVT_AD_HDUsableSpace": "EVT_AD_HD_USABLE_SPACE",
  "EVT_AD_HotspotOpLogin": "EVT_AD_HOTSPOT_OP_LOGIN",
  "EVT_AD_Login": "EVT_AD_LOGIN",
  "EVT_AD_LoginFailed": "EVT_AD_LOGIN_FAILED",
  "EVT_AD_MicroSDUsableSpace": "EVT_AD_MICRO_SD_USABLE_SPACE",
  "EVT_AD_PaymentRefunded": "EVT_AD_PAYMENT_REFUNDED",
  "EVT_AD_UpdateAvailable": "EVT_AD_UPDATE_AVAILABLE",
  "EVT_AD_VoucherCreated": "EVT_AD_VOUCHER_CREATED",
  "EVT_AD_VoucherDeleted": "EVT_AD_VOUCHER_DELETED",
  "EVT_AD_VouchersDeleted": {
    "key": "EVT_AD_VOUCHERS_DELETED",
    "pluralize": true
  },
  "EVT_AP_Adopted": "EVT_AP_ADOPTED",
  "EVT_AP_AutoReadopted": "EVT_AP_AUTO_READOPTED",
  "EVT_AP_ARPCacheTimeoutNoDevice": "EVT_AP_ARP_CACHE_TIMEOUT_NO_DEVICE",
  "EVT_AP_ChannelChanged": "EVT_AP_CHANNEL_CHANGED",
  "EVT_AP_Configured": "EVT_AP_CONFIGURED",
  "EVT_AP_Connected": "EVT_AP_CONNECTED",
  "EVT_AP_Deleted": "EVT_AP_DELETED",
  "EVT_AP_DetectRogueAP": "EVT_AP_DETECT_ROGUE_AP",
  "EVT_AP_DiscoveredPending": "EVT_AP_DISCOVERED_PENDING",
  "EVT_AP_EliteDeviceChanged": "EVT_AP_ELITE_DEVICE_CHANGED",
  "EVT_AP_EliteDeviceRevoke": "EVT_AP_ELITE_DEVICE_REVOKE",
  "EVT_AP_EliteDeviceOffline": "EVT_AP_ELITE_DEVICE_OFFLINE",
  "EVT_AP_FirmwareCheckFailed": "EVT_AP_FIRMWARE_CHECK_FAILED",
  "EVT_AP_FirmwareDownloadFailed": "EVT_AP_FIRMWARE_DOWNLOAD_FAILED",
  "EVT_AP_HostKeyMismatch": "EVT_AP_HOST_KEY_MISMATCH",
  "EVT_AP_Isolated": "EVT_AP_ISOLATED",
  "EVT_AP_LicenseChanged": "EVT_AP_LICENSE_CHANGED",
  "EVT_AP_LicenseInvalid": "EVT_AP_LICENSE_INVALID",
  "EVT_AP_LicenseValid": "EVT_AP_LICENSE_VALID",
  "EVT_AP_Lost_Contact": "EVT_AP_LOST_CONTACT",
  "EVT_AP_MulticastBlockNoDevice": "EVT_AP_MULTICAST_BLOCK_NO_DEVICE",
  "EVT_AP_MinRateNGAutoOptimized": "EVT_AP_MIN_RATE_NG_AUTO_OPTIMIZED",
  "EVT_AP_MulticastBlockAutoEnabled": "EVT_AP_MULTICAST_BLOCK_AUTO_ENABLED",
  "EVT_AP_No2GHzByOuiAutoEnabled": "EVT_AP_NO_2GHZ_BY_OUI_AUTO_ENABLED",
  "EVT_AP_PossibleInterference": "EVT_AP_POSSIBLE_INTERFERENCE",
  "EVT_AP_RadarDetected": "EVT_AP_RADAR_DETECTED",
  "EVT_AP_RediscoveredPending": "EVT_AP_REDISCOVERED_PENDING",
  "EVT_AP_Restarted": "EVT_AP_RESTARTED",
  "EVT_AP_RestartedUnknown": "EVT_AP_RESTARTED_UNKNOWN",
  "EVT_AP_RestartProc": "EVT_AP_RESTART_PROC",
  "EVT_AP_RollUpgrade": "EVT_AP_ROLL_UPGRADE",
  "EVT_AP_Upgraded": "EVT_AP_UPGRADED",
  "EVT_AP_UpgradeScheduled": "EVT_AP_UPGRADE_SCHEDULED",
  "EVT_AP_PlanFinished": "EVT_AP_PLAN_FINISHED",
  "EVT_AP_WiFiUXIncreased": "EVT_AP_WIFI_UX_INCREASED",
  "EVT_CF_VwireSet": "EVT_CF_VWIRE_SET",
  "EVT_CF_VwireUnset": "EVT_CF_VWIRE_UNSET",
  "EVT_DM_CommitError": "EVT_DM_COMMIT_ERROR",
  "EVT_DM_Connected": "EVT_DM_CONNECTED",
  "EVT_DM_Lost_Contact": "EVT_DM_LOST_CONTACT",
  "EVT_DM_RestartedUnknown": "EVT_DM_RESTARTED_UNKNOWN",
  "EVT_DM_Upgraded": "EVT_DM_UPGRADED",
  "EVT_DM_UpgradeScheduled": "EVT_DM_UPGRADE_SCHEDULED",
  "EVT_GW_Adopted": "EVT_GW_ADOPTED",
  "EVT_GW_AutoReadopted": "EVT_GW_AUTO_READOPTED",
  "EVT_GW_CommitError": "EVT_GW_COMMIT_ERROR",
  "EVT_GW_Connected": "EVT_GW_CONNECTED",
  "EVT_GW_Deleted": "EVT_GW_DELETED",
  "EVT_GW_DhcpPoolExhausted": "EVT_GW_DHCP_POOL_EXHAUSTED",
  "EVT_GW_DhcpPoolNearExhausted": "EVT_GW_DHCP_POOL_NEAR_EXHAUSTED",
  "EVT_GW_DiscoveredPending": "EVT_GW_DISCOVERED_PENDING",
  "EVT_GW_EliteDeviceChanged": "EVT_GW_ELITE_DEVICE_CHANGED",
  "EVT_GW_EliteDeviceRevoke": "EVT_GW_ELITE_DEVICE_REVOKE",
  "EVT_GW_EliteDeviceOffline": "EVT_GW_ELITE_DEVICE_OFFLINE",
  "EVT_GW_FirmwareCheckFailed": "EVT_GW_FIRMWARE_CHECK_FAILED",
  "EVT_GW_FirmwareDownloadFailed": "EVT_GW_FIRMWARE_DOWNLOAD_FAILED",
  "EVT_GW_HostKeyMismatch": "EVT_GW_HOST_KEY_MISMATCH",
  "EVT_GW_IpReputationAlert": "EVT_GW_IP_REPUTATION_ALERT",
  "EVT_GW_IPSUpdateError": "EVT_GW_IPS_UPDATE_ERROR",
  "EVT_GW_LicenseChanged": "EVT_GW_LICENSE_CHANGED",
  "EVT_GW_LicenseInvalid": "EVT_GW_LICENSE_INVALID",
  "EVT_GW_LicenseValid": "EVT_GW_LICENSE_VALID",
  "EVT_GW_Lost_Contact": "EVT_GW_LOST_CONTACT",
  "EVT_GW_NetworkAutoScaled": "EVT_GW_NETWORK_AUTO_SCALED",
  "EVT_GW_NetworkAutoScaleFailed": "EVT_GW_NETWORK_AUTO_SCALE_FAILED",
  "EVT_GW_Restarted": "EVT_GW_RESTARTED",
  "EVT_GW_RestartedUnknown": "EVT_GW_RESTARTED_UNKNOWN",
  "EVT_GW_RestartProc": "EVT_GW_RESTART_PROC",
  "EVT_GW_Upgraded": "EVT_GW_UPGRADED",
  "EVT_GW_UpgradeScheduled": "EVT_GW_UPGRADE_SCHEDULED",
  "EVT_GW_WANTransition": "EVT_GW_WANTRANSITION",
  "EVT_HS_AuthedByNoAuth": "EVT_HS_AUTHED_BY_NO_AUTH",
  "EVT_HS_AuthedByPassword": "EVT_HS_AUTHED_BY_PASSWORD",
  "EVT_HS_PaymentProcessed": "EVT_HS_PAYMENT_PROCESSED",
  "EVT_HS_VoucherUsed": "EVT_HS_VOUCHER_USED",
  "EVT_IPS_IpsAlert": "EVT_IPS_IPS_ALERT",
  "EVT_LC_Blocked": "EVT_LC_BLOCKED",
  "EVT_LC_Unblocked": "EVT_LC_UNBLOCKED",
  "EVT_LG_Connected": "EVT_LG_CONNECTED",
  "EVT_LG_Disconnected": "EVT_LG_DISCONNECTED",
  "EVT_LTE_ConnectedToLte": "EVT_ULTE_CONNECTED_TO_ULTE",
  "EVT_LTE_NotConnectedToLte": "EVT_ULTE_NOT_CONNECTED_TO_ULTE",
  "EVT_LTE_NotConnectedToLte_Alert": "EVT_ULTE_NOT_CONNECTED_TO_ULTE",
  "EVT_LTE_RegisteredToLte": "EVT_ULTE_REGISTERED_TO_ULTE",
  "EVT_LTE_NotRegisteredToLte": "EVT_ULTE_NOT_REGISTERED_TO_ULTE",
  "EVT_LTE_NotRegisteredToLte_Alert": "EVT_ULTE_NOT_REGISTERED_TO_ULTE",
  "EVT_LTE_Adopted": "EVT_ULTE_ADOPTED",
  "EVT_LTE_AutoReadopted": "EVT_ULTE_AUTO_READOPTED",
  "EVT_LTE_Connected": "EVT_ULTE_CONNECTED",
  "EVT_LTE_DiscoveredPending": "EVT_ULTE_DISCOVERED_PENDING",
  "EVT_LTE_Deleted": "EVT_ULTE_DELETED",
  "EVT_LTE_HardLimitUsed": "EVT_ULTE_HARD_LIMIT_USED",
  "EVT_LTE_HardLimitCutoff": "EVT_ULTE_HARD_LIMIT_CUTOFF",
  "EVT_LTE_Threshold": "EVT_ULTE_THRESHOLD",
  "EVT_LU_Connected": "EVT_LU_CONNECTED",
  "EVT_LU_Disconnected": "EVT_LU_DISCONNECTED",
  "EVT_PA_IncorrectStreamConfiguration": "EVT_PA_INCORRECT_STREAM_CONFIGURATION",
  "EVT_PA_ScheduledStreamFailed": "EVT_PA_SCHEDULED_STREAM_FAILED",
  "EVT_PA_StreamSkippedDevices": "EVT_PA_STREAM_SKIPPED_DEVICES",
  "EVT_SW_Adopted": "EVT_SW_ADOPTED",
  "EVT_SW_AutoReadopted": "EVT_SW_AUTO_READOPTED",
  "EVT_SW_Connected": "EVT_SW_CONNECTED",
  "EVT_SW_Deleted": "EVT_SW_DELETED",
  "EVT_SW_DetectRogueDHCP": "EVT_SW_DETECT_ROGUE_DHCP",
  "EVT_SW_DiscoveredPending": "EVT_SW_DISCOVERED_PENDING",
  "EVT_SW_EliteDeviceChanged": "EVT_SW_ELITE_DEVICE_CHANGED",
  "EVT_SW_EliteDeviceRevoke": "EVT_SW_ELITE_DEVICE_REVOKE",
  "EVT_SW_EliteDeviceOffline": "EVT_SW_ELITE_DEVICE_OFFLINE",
  "EVT_SW_HostKeyMismatch": "EVT_SW_HOST_KEY_MISMATCH",
  "EVT_SW_FirmwareCheckFailed": "EVT_SW_FIRMWARE_CHECK_FAILED",
  "EVT_SW_FirmwareDownloadFailed": "EVT_SW_FIRMWARE_DOWNLOAD_FAILED",
  "EVT_SW_LicenseChanged": "EVT_SW_LICENSE_CHANGED",
  "EVT_SW_LicenseInvalid": "EVT_SW_LICENSE_INVALID",
  "EVT_SW_LicenseValid": "EVT_SW_LICENSE_VALID",
  "EVT_SW_LoopDetected": "EVT_SW_LOOP_DETECTED",
  "EVT_SW_Lost_Contact": "EVT_SW_LOST_CONTACT",
  "EVT_SW_Overheat": "EVT_SW_OVERHEAT",
  "EVT_SW_PoeOverload": "EVT_SW_POE_OVERLOAD",
  "EVT_SW_PoeDisconnect": "EVT_SW_POE_DISCONNECT",
  "EVT_SW_Restarted": "EVT_SW_RESTARTED",
  "EVT_SW_RestartedUnknown": "EVT_SW_RESTARTED_UNKNOWN",
  "EVT_SW_RestartProc": "EVT_SW_RESTART_PROC",
  "EVT_SW_StpPortBlocking": "EVT_SW_STP_PORT_BLOCKING",
  "EVT_SW_Upgraded": "EVT_SW_UPGRADED",
  "EVT_SW_UpgradeScheduled": "EVT_SW_UPGRADE_SCHEDULED",
  "EVT_WC_Blocked": "EVT_WC_BLOCKED",
  "EVT_WC_Unblocked": "EVT_WC_UNBLOCKED",
  "EVT_WG_AuthorizationEnded": "EVT_WG_AUTHORIZATION_ENDED",
  "EVT_WG_AuthorizationEndedByQuota": "EVT_WG_AUTHORIZATION_ENDED_BY_QUOTA",
  "EVT_WG_Connected": "EVT_WG_CONNECTED",
  "EVT_WG_Disconnected": "EVT_WG_DISCONNECTED",
  "EVT_WG_Roam": "EVT_WG_ROAM",
  "EVT_WG_RoamRadio": "EVT_WG_ROAM_RADIO",
  "EVT_WU_Connected": "EVT_WU_CONNECTED",
  "EVT_WU_Disconnected": "EVT_WU_DISCONNECTED",
  "EVT_WU_Roam": "EVT_WU_ROAM",
  "EVT_WU_RoamRadio": "EVT_WU_ROAM_RADIO",
  "EVT_XG_Adopted": "EVT_XG_ADOPTED",
  "EVT_XG_AutoReadopted": "EVT_XG_AUTO_READOPTED",
  "EVT_XG_CommitError": "EVT_XG_COMMIT_ERROR",
  "EVT_XG_Connected": "EVT_XG_CONNECTED",
  "EVT_XG_Deleted": "EVT_XG_DELETED",
  "EVT_XG_DiscoveredPending": "EVT_XG_DISCOVERED_PENDING",
  "EVT_XG_Lost_Contact": "EVT_XG_LOST_CONTACT",
  "EVT_XG_OutletPowerCycle": "EVT_XG_OUTLET_POWER_CYCLE",
  "EVT_XG_RestartedUnknown": "EVT_XG_RESTARTED_UNKNOWN",
  "EVT_XG_Upgraded": "EVT_XG_UPGRADED",
  "EVT_XG_UpgradeScheduled": "EVT_XG_UPGRADE_SCHEDULED",
  "EVT_BB_DiscoveredPending": "EVT_BB_DISCOVERED_PENDING",
  "EVT_BB_RediscoveredPending": "EVT_BB_REDISCOVERED_PENDING",
  "EVT_BB_Adopted": "EVT_BB_ADOPTED",
  "EVT_BB_HostKeyMismatch": "EVT_BB_HOST_KEY_MISMATCH",
  "EVT_BB_Deleted": "EVT_BB_DELETED",
  "EVT_BB_Restarted": "EVT_BB_RESTARTED",
  "EVT_BB_RestartedUnknown": "EVT_BB_RESTARTED_UNKNOWN",
  "EVT_BB_AutoReadopted": "EVT_BB_AUTO_READOPTED",
  "EVT_BB_Configured": "EVT_BB_CONFIGURED",
  "EVT_BB_Connected": "EVT_BB_CONNECTED",
  "EVT_BB_ChannelChanged": "EVT_BB_CHANNEL_CHANGED",
  "EVT_BB_PossibleInterference": "EVT_BB_POSSIBLE_INTERFERENCE",
  "EVT_BB_RollUpgrade": "EVT_BB_ROLL_UPGRADE",
  "EVT_BB_Upgraded": "EVT_BB_UPGRADED",
  "EVT_BB_UpgradeScheduled": "EVT_BB_UPGRADE_SCHEDULED",
  "EVT_BB_Lost_Contact": "EVT_BB_LOST_CONTACT",
  "EVT_BB_LicenseChanged": "EVT_BB_LICENSE_CHANGED",
  "EVT_BB_FirmwareCheckFailed": "EVT_BB_FIRMWARE_CHECK_FAILED",
  "EVT_BB_FirmwareDownloadFailed": "EVT_BB_FIRMWARE_DOWNLOAD_FAILED",
  "EVT_BB_RestartProc": "EVT_BB_RESTART_PROC",
  "EVT_BB_LinkRadioChanged": "EVT_BB_LINK_RADIO_CHANGED",
  "EVT_USP_RpsPortPowerDelivering": "EVT_USP_RPS_PORT_POWER_DELIVERING",
  "EVT_USP_RpsOutOfBudget": "EVT_USP_RPS_OUT_OF_BUDGET",
  "EVT_USP_RpsPortOverload": "EVT_USP_RPS_PORT_OVERLOAD",
  "EVT_USP_RpsPowerDeniedByPsuOverload": "EVT_USP_RPS_POWER_DENIED_BY_PSU_OVERLOAD",
  "EVT_USP_RpsPortErrorBlocked": "EVT_USP_RPS_PORT_ERROR_BLOCKED",
  "EVT_USP_OutletPowerCycle": "EVT_USP_OUTLET_POWER_CYCLE"
}

"EVT_AD_AUTO_BACKUP_FAILED_CLOUD_KEY_SD_CARD_NOT_FOUND": "Auto backup is skipped because SD card is not installed",
  "EVT_AD_BACKUP_CREATED": "Backup has been created",
  "EVT_AD_GUEST_AUTHORIZED_FOR": "Guest[{guest}] is authorized by {admin} for {minutes} minutes",
  "EVT_AD_GUEST_EXTENDED": "Guest[{guest}]'s authorization is extended by {admin}",
  "EVT_AD_GUEST_UNAUTHORIZED": "Guest[{guest}] is unauthorized by {admin}",
  "EVT_AD_HD_USABLE_SPACE": "The UniFi Controller data partition is nearly full. Only {usable_bytes} of {total_bytes} free",
  "EVT_AD_HOTSPOT_OP_LOGIN": "Hotspot operator {admin} log in",
  "EVT_AD_LOGIN": "Admin {admin} log in from {ip}",
  "EVT_AD_LOGIN_FAILED": "Admin {admin} login failed",
  "EVT_AD_MICRO_SD_USABLE_SPACE": "The UniFi Controller Micro SD card nearly full. Only {usable_bytes} of {total_bytes} free",
  "EVT_AD_PAYMENT_REFUNDED": "Payment from {name}, ${amount}, is refunded by {admin}",
  "EVT_AD_UPDATE_AVAILABLE": "A new version ({version}) of UniFi Controller is available",
  "EVT_AD_VOUCHER_CREATED": "{admin} created {num} {use} voucher(s)",
  "EVT_AD_VOUCHER_DELETED": "Voucher[{code}] was deleted",
  "EVT_AD_VOUCHERS_DELETED": "{count, plural, one{1 voucher was deleted} other{# vouchers were deleted}}",
  "EVT_AP_ADOPTED": "AP[{ap}] was adopted by {admin}",
  "EVT_AP_AUTO_READOPTED": "AP[{ap}] was automatically readopted",
  "EVT_AP_CHANNEL_CHANGED": "AP[{ap}] changed the channel from \"{channel_from}\" to \"{channel_to}\"",
  "EVT_AP_PLAN_FINISHED": "{trigger}: plan {radio} {action}: {fitness_before} => {fitness_after} Mbit/s",
  "EVT_AP_WIFI_UX_INCREASED": "{trigger}: WiFi Experience increased from {wifi_ux_before} to {wifi_ux_after}",
  "EVT_AP_CONFIGURED": "AP[{ap}] was configured",
  "EVT_AP_CONNECTED": "AP[{ap}] was connected",
  "EVT_AP_DELETED": "AP[{ap}] was deleted by {admin}",
  "EVT_AP_DETECT_ROGUE_AP": "Rogue Access Point {essid} [{mac}] was detected",
  "EVT_AP_DISCOVERED_PENDING": "AP[{ap}] was discovered and waiting for adoption",
  "EVT_AP_ELITE_DEVICE_CHANGED": "AP[{ap}] Elite License has been updated",
  "EVT_AP_ELITE_DEVICE_REVOKE": "AP[{ap}] Elite License was revoked",
  "EVT_AP_ELITE_DEVICE_OFFLINE": "AP[{ap}] is offline more than 8h",
  "EVT_AP_FIRMWARE_CHECK_FAILED": "AP[{ap}] update failed: firmware check failed (error: {rc})",
  "EVT_AP_FIRMWARE_DOWNLOAD_FAILED": "AP[{ap}] update failed: download failed (error: curl:{curl_rc}, http:{http_rc})",
  "EVT_AP_HOST_KEY_MISMATCH": "AP[{ap}] failed SSH host key verification",
  "EVT_AP_ISOLATED": "AP[{ap}] became isolated",
  "EVT_AP_LOST_CONTACT": "AP[{ap}] was disconnected",
  "EVT_AP_LICENSE_CHANGED": "AP[{ap}] license has changed to {license}",
  "EVT_AP_LICENSE_INVALID": "AP[{ap}] has invalid license",
  "EVT_AP_LICENSE_VALID": "AP[{ap}] has valid license",
  "EVT_AP_MULTICAST_BLOCK_NO_DEVICE": "Enable multicast blocking for SSID \"{ssid}\" and add your network's router to the excepted devices list",
  "EVT_AP_MULTICAST_BLOCK_AUTO_ENABLED": "Multicast blocking for SSID \"{ssid}\" was automatically enabled",
  "EVT_AP_NO_2GHZ_BY_OUI_AUTO_ENABLED": "Connecting high performance clients to 5 GHz only for SSID \"{ssid}\" was automatically enabled",
  "EVT_AP_NOTIFICATION": "AP[{ap}] event: {payload}",
  "EVT_AP_POSSIBLE_INTERFERENCE": "AP[{ap}] was encountering some interference on channel {channel}",
  "EVT_AP_RADAR_DETECTED": "AP[{ap}] detected radar on channel {radar_channel} ({freq} MHz)",
  "EVT_AP_REDISCOVERED_PENDING": "AP[{ap}] was rediscovered and waiting for adoption",
  "EVT_AP_RESTARTED": "AP[{ap}] was restarted by {admin}",
  "EVT_AP_RESTARTED_UNKNOWN": "AP[{ap}] was restarted ({duration} connected, {num_sta} clients)",
  "EVT_AP_RESTART_PROC": "AP[{ap}] {proc} exited with code {exit_status} and restarted by {caller}",
  "EVT_AP_ROLL_UPGRADE": "Rolling Update has been triggered by {admin}",
  "EVT_AP_UPGRADE_SCHEDULED": "AP[{ap}] was scheduled for update by {admin}",
  "EVT_AP_UPGRADED": "AP[{ap}] was updated from \"{version_from}\" to \"{version_to}\"",
  "EVT_AP_WIRELESS_EVENT": "AP[{ap}] wireless event: {wevent}",
  "EVT_BB_DISCOVERED_PENDING": "Bridge [{bb}] was discovered and waiting for adoption",
  "EVT_BB_REDISCOVERED_PENDING": "Bridge [{bb}] was rediscovered and waiting for adoption",
  "EVT_BB_ADOPTED": "Bridge [{bb}] was adopted by {admin}",
  "EVT_BB_HOST_KEY_MISMATCH": "Bridge [{bb}] failed SSH host key verification",
  "EVT_BB_DELETED": "Bridge [{bb}] was deleted by {admin}",
  "EVT_BB_RESTARTED": "Bridge [{bb}] was restarted by {admin}",
  "EVT_BB_RESTARTED_UNKNOWN": "Bridge [{bb}] was restarted ({duration} connected, {num_sta} clients)",
  "EVT_BB_AUTO_READOPTED": "Bridge [{bb}] was automatically readopted",
  "EVT_BB_CONFIGURED": "Bridge [{bb}] was configured",
  "EVT_BB_CONNECTED": "Bridge [{bb}] was connected",
  "EVT_BB_CHANNEL_CHANGED": "Bridge [{bb}] changed the channel from \"{channel_from}\" to \"{channel_to}\"",
  "EVT_BB_POSSIBLE_INTERFERENCE": "Bridge [{bb}] was encountering some interference on channel {channel}",
  "EVT_BB_ROLL_UPGRADE": "Rolling Update has been triggered by {admin}",
  "EVT_BB_UPGRADED": "Bridge [{bb}] was updated from \"{version_from}\" to \"{version_to}\"",
  "EVT_BB_UPGRADE_SCHEDULED": "Bridge [{bb}] was scheduled for update by {admin}",
  "EVT_BB_LOST_CONTACT": "Bridge [{bb}] was disconnected",
  "EVT_BB_LICENSE_CHANGED": "Bridge [{bb}] license has changed to {license}",
  "EVT_BB_NOTIFICATION": "Bridge [{bb}] event: {payload}",
  "EVT_BB_FIRMWARE_CHECK_FAILED": "Bridge[{bb}] update failed: firmware check failed (error: {rc})",
  "EVT_BB_FIRMWARE_DOWNLOAD_FAILED": "Bridge [{bb}] update failed: download failed (error: curl:{curl_rc}, http:{http_rc})",
  "EVT_BB_RESTART_PROC": "Bridge [{bb}] {proc} exited with code {exit_status} and restarted by {caller}",
  "EVT_BB_LINK_RADIO_CHANGED": "Bridge [{bb}] changed the radio from  \"{radio_from}\" to \"{radio_to}\"",
  "EVT_CF_VWIRE_SET": "Wireless uplink is configured between AP[{ap_from}] and AP[{ap_to}]",
  "EVT_CF_VWIRE_UNSET": "Wireless uplink between AP[{ap_from}] and AP[{ap_to}] is disconnected",
  "EVT_GW_ADOPTED": "Gateway[{gw}] was adopted by {admin}",
  "EVT_GW_AUTO_READOPTED": "Gateway[{gw}] was automatically readopted",
  "EVT_GW_COMMIT_ERROR": "Gateway[{gw}] configuration commit error. Error message: {commit_errors}",
  "EVT_GW_CONNECTED": "Gateway[{gw}] was connected",
  "EVT_GW_DELETED": "Gateway[{gw}] was deleted by {admin}",
  "EVT_GW_DISCOVERED_PENDING": "Gateway[{gw}] was discovered and waiting for adoption",
  "EVT_GW_ELITE_DEVICE_CHANGED": "Gateway[{gw}] Elite License has been updated",
  "EVT_GW_ELITE_DEVICE_REVOKE": "Gateway[{gw}] Elite License was revoked",
  "EVT_GW_ELITE_DEVICE_OFFLINE": "Gateway[{gw}] is offline more than 8h",
  "EVT_GW_FIRMWARE_CHECK_FAILED": "Gateway[{gw}] update failed: firmware check failed (error: {rc})",
  "EVT_GW_FIRMWARE_DOWNLOAD_FAILED": "Gateway[{gw}] update failed: download failed (error: curl:{curl_rc}, http:{http_rc})",
  "EVT_GW_HOST_KEY_MISMATCH": "Gateway[{gw}] failed SSH host key verification",
  "EVT_GW_LICENSE_CHANGED": "Gateway[{gw}] license has changed to {license}",
  "EVT_GW_LICENSE_INVALID": "Gateway[{gw}] has invalid license",
  "EVT_GW_LICENSE_VALID": "Gateway[{gw}] has valid license",
  "EVT_GW_LOST_CONTACT": "Gateway[{gw}] was disconnected",
  "EVT_GW_NOTIFICATION": "Gateway[{gw}] event: {payload}",
  "EVT_GW_RESTARTED": "Gateway[{gw}] was restarted by {admin}",
  "EVT_GW_RESTARTED_UNKNOWN": "Gateway[{gw}] was restarted",
  "EVT_GW_RESTART_PROC": "Gateway[{gw}] {proc} exited with code {exit_status} and restarted by {caller}",
  "EVT_GW_UPGRADE_SCHEDULED": "Gateway[{gw}] was scheduled for update by {admin}",
  "EVT_GW_UPGRADED": "Gateway[{gw}] was updated from \"{version_from}\" to \"{version_to}\"",
  "EVT_GW_WANTRANSITION": "Gateway[{gw}] WAN iface [{iface}] transition to state [{state}]",
  "EVT_GW_DHCP_POOL_EXHAUSTED": "{gw} DHCP pool for Network \"{network_name}\" is exhausted, turn on auto-scaling to resolve this issue",
  "EVT_GW_DHCP_POOL_NEAR_EXHAUSTED": "{gw} DHCP pool for Network \"{network_name}\" is nearing exhaustion, turn on auto-scaling to resolve this issue",
  "EVT_GW_NETWORK_AUTO_SCALED": "{gw} Network \"{network_name}\" has been auto-scaled",
  "EVT_GW_NETWORK_AUTO_SCALE_FAILED": "{gw} DHCP pool for Network \"{network_name}\" is exhausted but couldn’t be auto-scaled due to conflicting {reason}",
  "EVT_HS_AUTHED_BY_NO_AUTH": "Guest[{guest}] is authorized by no authentication",
  "EVT_HS_AUTHED_BY_PASSWORD": "Guest[{guest}] is authorized by password",
  "EVT_HS_PAYMENT_PROCESSED": "Payment from Guest[{guest}] ({name}), ${amount} is processed through {method}",
  "EVT_HS_VOUCHER_USED": "Voucher[{code}] was used by Guest[{guest}]",
  "EVT_IPS_IPS_ALERT": "Threat Management Alert {inner_alert_severity}: {inner_alert_category}. Signature {inner_alert_signature}. From: {src_ip}:{src_port}, to: {dest_ip}:{dest_port}, protocol: {proto}",
  "EVT_LC_BLOCKED": "Client[{client}] is blocked by {admin}",
  "EVT_LC_UNBLOCKED": "Client[{client}] is unblocked by {admin}",
  "EVT_LG_CONNECTED": "Guest[{guest}] has connected to {network}",
  "EVT_LG_DISCONNECTED": "Guest[{guest}] disconnected from \"{network}\" ({duration} connected, {bytes})",
  "EVT_ULTE_CONNECTED_TO_ULTE": "[{lte}] is connected to UniFi LTE",
  "EVT_ULTE_NOT_CONNECTED_TO_ULTE": "[{lte}] is not connected to UniFi LTE",
  "EVT_ULTE_REGISTERED_TO_ULTE": "[{lte}] is registered to UniFi LTE",
  "EVT_ULTE_NOT_REGISTERED_TO_ULTE": "[{lte}] is not registered to UniFi LTE",
  "EVT_ULTE_ADOPTED": "UniFi LTE[{lte}] was adopted by {admin}",
  "EVT_ULTE_AUTO_READOPTED": "UniFi LTE[{lte}] was automatically readopted",
  "EVT_ULTE_CONNECTED": "UniFi LTE[{lte}] was connected",
  "EVT_ULTE_NOTIFICATION": "UniFi LTE[{lte}] event: {payload}",
  "EVT_ULTE_DISCOVERED_PENDING": "UniFi LTE[{lte}] was discovered and waiting for adoption",
  "EVT_ULTE_DELETED": "UniFi LTE[{lte}] was deleted by {admin}",
  "EVT_ULTE_HARD_LIMIT_USED": "UniFi LTE[{dev}] has exceeded its {softlimit} LTE data limit by {excess}. It has {hard_data_left} left before being disabled for this billing period. This limit can be increased in the device configuration panel.",
  "EVT_ULTE_HARD_LIMIT_CUTOFF": "UniFi LTE[{dev}] has exceeded its {softlimit} LTE data limit by {excess}. It has reached the cutoff limit and has been disabled for the rest of this billing period. To re-enable this device, increase the data limit in the device configuration panel.",
  "EVT_ULTE_THRESHOLD": "UniFi LTE[{dev}] has used {used} of {softlimit} LTE data for the billing period. This limit can be adjusted in the device configuration panel.",
  "EVT_ULTE_PIN_VERIFIED": "ULTE Pro PIN Verified.",
  "EVT_ULTE_DEFAULT_PROFILE_SET": "ULTE Pro default Profile Set.",
  "EVT_USP_RPS_PORT_POWER_DELIVERING": "RPS is delivering power on port {port}. Connected device has internal power supply failure or loss of an AC",
  "EVT_USP_RPS_OUT_OF_BUDGET": "RPS out of power budget. Available power is less than required power on the port {port}",
  "EVT_USP_RPS_PORT_OVERLOAD": "RPS is overloading or short circuit on port {port}",
  "EVT_USP_RPS_POWER_DENIED_BY_PSU_OVERLOAD": "RPS is denied power by PSU overloading on port {port}",
  "EVT_USP_RPS_PORT_ERROR_BLOCKED": "RPS blocked port {port} by critical error",
  "EVT_USP_OUTLET_POWER_CYCLE": "Plug {ap} - outlet {outlet} has been restarted",
  "EVT_LU_CONNECTED": "User[{user}] has connected to {network}",
  "EVT_LU_DISCONNECTED": "User[{user}] disconnected from \"{network}\" ({duration} connected, {bytes})",
  "EVT_PA_INCORRECT_STREAM_CONFIGURATION": "Incorrect scheduled stream configuration {name}",
  "EVT_PA_SCHEDULED_STREAM_FAILED": "Scheduled task {name} failed",
  "EVT_PA_STREAM_SKIPPED_DEVICES": "Stream {name} skipped devices: {devices}",
  "EVT_SW_ADOPTED": "Switch[{sw}] was adopted by {admin}",
  "EVT_SW_AUTO_READOPTED": "Switch[{sw}] was automatically readopted",
  "EVT_SW_CONNECTED": "Switch[{sw}] was connected",
  "EVT_SW_DELETED": "Switch[{sw}] was deleted by {admin}",
  "EVT_SW_DETECT_ROGUE_DHCP": "Switch[{sw}] detected rogue DHCP server {ip} [{mac}] on port {port} VLAN {vlan}",
  "EVT_SW_DISCOVERED_PENDING": "Switch[{sw}] was discovered and waiting for adoption",
  "EVT_SW_ELITE_DEVICE_CHANGED": "Switch[{sw}] Elite License has been updated",
  "EVT_SW_ELITE_DEVICE_REVOKE": "Switch[{sw}] Elite License was revoked",
  "EVT_SW_ELITE_DEVICE_OFFLINE": "Switch[{sw}] is offline more than 8h",
  "EVT_SW_FIRMWARE_CHECK_FAILED": "Switch[{sw}] update failed: firmware check failed (error: {rc})",
  "EVT_SW_FIRMWARE_DOWNLOAD_FAILED": "Switch[{sw}] update failed: download failed (error: curl:{curl_rc}, http:{http_rc})",
  "EVT_SW_HOST_KEY_MISMATCH": "Switch[{sw}] failed SSH host key verification",
  "EVT_SW_LICENSE_CHANGED": "Switch[{sw}] license has changed to {license}",
  "EVT_SW_LICENSE_INVALID": "Switch[{sw}] has invalid license",
  "EVT_SW_LICENSE_VALID": "Switch[{sw}] has valid license",
  "EVT_SW_LOOP_DETECTED": "Switch[{sw}] loop detected on port {port}",
  "EVT_SW_LOST_CONTACT": "Switch[{sw}] was disconnected",
  "EVT_SW_NOTIFICATION": "Switch[{sw}] event: {payload}",
  "EVT_SW_OVERHEAT": "Switch[{sw}] is overheating",
  "EVT_SW_POE_OVERLOAD": "Switch[{sw}] PoE is overloading on port {port}",
  "EVT_SW_POE_DISCONNECT": "Switch[{sw}] PoE disconnected on port {port}",
  "EVT_SW_RESTARTED": "Switch[{sw}] was restarted by {admin}",
  "EVT_SW_RESTARTED_UNKNOWN": "Switch[{sw}] was restarted",
  "EVT_SW_RESTART_PROC": "Switch[{sw}] {proc} exited with code {exit_status} and restarted by {caller}",
  "EVT_SW_STP_PORT_BLOCKING": "Switch[{sw}] port {port} blocked by STP protocol",
  "EVT_SW_UPGRADE_SCHEDULED": "Switch[{sw}] was scheduled for update by {admin}",
  "EVT_SW_UPGRADED": "Switch[{sw}] was updated from \"{version_from}\" to \"{version_to}\"",
  "EVT_XG_ADOPTED": "NeXt-Gen Gateway[{xg}] was adopted by {admin}",
  "EVT_XG_AUTO_READOPTED": "NeXt-Gen Gateway[{xg}] was automatically readopted",
  "EVT_XG_COMMIT_ERROR": "NeXt-Gen Gateway[{xg}] configuration commit error. Error message: {commit_errors}",
  "EVT_XG_CONNECTED": "NeXt-Gen Gateway[{xg}] was connected",
  "EVT_XG_DELETED": "NeXt-Gen Gateway[{xg}] was deleted by {admin}",
  "EVT_XG_DISCOVERED_PENDING": "NeXt-Gen Gateway[{xg}] was discovered and waiting for adoption",
  "EVT_XG_LOST_CONTACT": "NeXt-Gen Gateway[{xg}] was disconnected",
  "EVT_XG_NOTIFICATION": "NeXt-Gen Gateway[{xg}] event: {payload}",
  "EVT_XG_OUTLET_POWER_CYCLE": "NeXt-Gen Gateway[{xg}] - outlet {outlet} has been restarted",
  "EVT_XG_RESTARTED_UNKNOWN": "NeXt-Gen Gateway[{xg}] was restarted",
  "EVT_XG_UPGRADE_SCHEDULED": "NeXt-Gen Gateway[{xg}] was scheduled for update by {admin}",
  "EVT_XG_UPGRADED": "NeXt-Gen Gateway[{xg}] was updated from \"{version_from}\" to \"{version_to}\"",
  "EVT_WC_BLOCKED": "Client[{client}] is blocked by {admin}",
  "EVT_WC_UNBLOCKED": "Client[{client}] is unblocked by {admin}",
  "EVT_WG_AUTHORIZATION_ENDED": "Guest[{guest}] has become unauthorized",
  "EVT_WG_AUTHORIZATION_ENDED_BY_QUOTA": "Guest[{guest}] has become unauthorized (quota reached)",
  "EVT_WG_CONNECTED": "Guest[{guest}] has connected to AP[{ap}] with SSID \"{ssid}\" on channel {channel}",
  "EVT_WG_DISCONNECTED": "Guest[{guest}] disconnected from \"{ssid}\" ({duration} connected, {bytes}, last AP[{ap}])",
  "EVT_WG_ROAM": "Guest[{guest}] roams from AP[{ap_from}] to AP[{ap_to}] from {channel_from} to {channel_to} on \"{ssid}\"",
  "EVT_WG_ROAM_RADIO": "Guest[{guest}] roams from {channel_from} to {channel_to} at AP[{ap}]",
  "EVT_WU_CONNECTED": "User[{user}] has connected to AP[{ap}] with SSID \"{ssid}\" on channel {channel}",
  "EVT_WU_DISCONNECTED": "User[{user}] disconnected from \"{ssid}\" ({duration} connected, {bytes}, last AP[{ap}])",
  "EVT_WU_ROAM": "User[{user}] roams from AP[{ap_from}] to AP[{ap_to}] from channel {channel_from} to channel {channel_to} on SSID \"{ssid}\"",
  "EVT_WU_ROAM_RADIO": "User[{user}] roams from channel {channel_from} to channel {channel_to} at AP[{ap}]"


  obj.meta.message:
  events
  alert
  sta:sync
  device:sync
  unifi-device:sync

                        */


                        console.log(obj);
                        var listenTo = ['EVT_WU_Connected', 'EVT_WU_Disconnected', 'EVT_WU_Roam', 'EVT_WU_Roam_Radio', 'EVT_WG_Connected', 'EVT_WG_Disconnected', 'EVT_WG_Roam', 'EVT_WG_Roam_Radio', 'EVT_LU_Disconnected', 'EVT_LU_Connected']
                        if (obj.meta.message == 'events') {
                            if (listenTo.indexOf(obj.data[0].key) == -1) {
                                //nothing
                                console.log('-----------------------NEW EVENT-----------------------');
                                console.log('%s', data);
                                console.log('-----------------------NEW EVENT-----------------------');
                            } else {
                                console.log('%s', data);
                                if (typeof (cb) === 'function') {
                                    cb(false, obj);
                                }
                            }
                        }
                    });

                    _ws.on('error', function error(error) {
                        console.log(error);
                        if (typeof (cb) === 'function') {
                            cb({ message: error });
                        }
                    });

                    _ws.on('close', function close() {
                        console.log('Closed WS');
                        if (typeof (cb) === 'function') {
                            cb(false, 'STATUS_DISCONNECTED');                         
                        }
                    });
                })



            });
    };
};

exports.ControllerWS = ControllerWS;