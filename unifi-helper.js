const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');

var Controller = function (hostname, port, unifios, ssl, debug) {

    var _self = this;
    _self._cookieJar = new CookieJar();
    _self._unifios = unifios;
    _self._ssl = ssl;
    _self._baseurl = 'https://127.0.0.1:8443';
    _self._loggedIn = false;
    _self._debug = debug;

    if (typeof (hostname) !== 'undefined' && typeof (port) !== 'undefined') {
        _self._baseurl = 'https://' + hostname + ':' + port;
    }

    const jar = _self._cookieJar;
    const axiosinstance = axios.create({
        httpAgent: new HttpCookieAgent({ cookies: { jar } }),
        httpsAgent: new HttpsCookieAgent({ cookies: { jar }, rejectUnauthorized: _self._ssl, requestCert: true })
    });

    /**
     * Login to UniFi Controller - login()
     */
    _self.login = function (username, password, cb) {
        if (_self._loggedIn) {
            cb(false, "");
        } else {
            if (_self._unifios)
                _self._request('/api/auth/login', { username: username, password: password }, null, cb, 'POST');
            else
                _self._request('/api/login', { username: username, password: password }, null, cb, 'POST');

            _self._loggedIn = true;
        }
    };

    /**
     * Logout from UniFi Controller - logout()
     */
    _self.logout = function (cb) {
        if (_self._unifios) {
            //_self._request('/api/auth/logout', {}, null, cb, 'POST');
        }
        else {
            //_self._request('/api/logout', {}, null, cb, 'POST');
        }
    };

    //#region

    /**
     * Authorize a client device - authorize_guest()
     * -------------------------
     *
     * required paramater <sites>   = name or array of site names
     * required parameter <mac>     = client MAC address
     * required parameter <minutes> = minutes (from now) until authorization expires
     * required paramater <cb>      = the callback function that is called with the results
     * optional parameter <up>      = upload speed limit in kbps
     * optional parameter <down>    = download speed limit in kbps
     * optional parameter <MBytes>  = data transfer limit in MB
     * optional parameter <ap_mac>  = AP MAC address to which client is connected, should result in faster authorization
     */
    _self.authorizeGuest = function (sites, mac, minutes, cb, up, down, mbytes, ap_mac) {
        var json = { cmd: 'authorize-guest', mac: mac.toLowerCase() };
        if (typeof (minutes) !== 'undefined') json.minutes = minutes;
        if (typeof (up) !== 'undefined') json.up = up;
        if (typeof (down) !== 'undefined') json.down = down;
        if (typeof (mbytes) !== 'undefined') json.bytes = mbytes;
        if (typeof (ap_mac) !== 'undefined') json.ap_mac = ap_mac;

        _self._request('/api/s/<SITE>/cmd/stamgr', json, sites, cb);
    };

    /**
     * Unauthorize a client device - unauthorize_guest()
     * ---------------------------
     *
     * required paramater <sites>   = name or array of site names
     * required parameter <mac>     = client MAC address
     */
    _self.unauthorizeGuest = function (sites, mac, cb) {
        var json = { cmd: 'unauthorize-guest', mac: mac.toLowerCase() };

        _self._request('/api/s/<SITE>/cmd/stamgr', json, sites, cb);
    };

    /**
     * Reconnect a client device - reconnect_sta()
     * -------------------------
     *
     * required paramater <sites>   = name or array of site names
     * required parameter <mac>     = client MAC address
     */
    _self.reconnectClient = function (sites, mac, cb) {
        var json = { cmd: 'kick-sta', mac: mac.toLowerCase() };

        _self._request('/api/s/<SITE>/cmd/stamgr', json, sites, cb);
    };

    /**
     * Block a client device - block_sta()
     * ---------------------
     *
     * required paramater <sites>   = name or array of site names
     * required parameter <mac>     = client MAC address
     */
    _self.blockClient = function (sites, mac, cb) {
        var json = { cmd: 'block-sta', mac: mac.toLowerCase() };

        _self._request('/api/s/<SITE>/cmd/stamgr', json, sites, cb);
    };

    /**
     * Unblock a client device - unblock_sta()
     * -----------------------
     *
     * required paramater <sites>   = name or array of site names
     * required parameter <mac>     = client MAC address
     */
    _self.unblockClient = function (sites, mac, cb) {
        var json = { cmd: 'unblock-sta', mac: mac.toLowerCase() };

        _self._request('/api/s/<SITE>/cmd/stamgr', json, sites, cb);
    };

    /**
     * Add/modify a client device note - set_sta_note()
     * -------------------------------
     *
     * required paramater <sites>   = name or array of site names
     * required parameter <user_id> = id of the user device to be modified
     * optional parameter <note>    = note to be applied to the user device
     *
     * NOTES:
     * - when note is empty or not set, the existing note for the user will be removed and "noted" attribute set to FALSE
     */
    _self.setClientNote = function (sites, user_id, cb, note) {
        var noted = 1;
        if (typeof (note) === 'undefined') {
            note = '';
            noted = 0;
        }

        _self._request('/api/s/<SITE>/upd/user/' + user_id.trim(), { note: note, noted: noted }, sites, cb);
    };

    /**
     * Add/modify a client device name - set_sta_name()
     * -------------------------------
     *
     * required paramater <sites>   = name or array of site names
     * required parameter <user_id> = id of the user device to be modified
     * optional parameter <name>    = name to be applied to the user device
     *
     * NOTES:
     * - when name is empty or not set, the existing name for the user will be removed
     */
    _self.setClientName = function (sites, user_id, cb, name) {
        if (typeof (name) === 'undefined')
            name = '';

        _self._request('/api/s/<SITE>/upd/user/' + user_id.trim(), { name: name }, sites, cb);
    };

    /**
     * Daily site stats method - stat_daily_site()
     * -----------------------
     *
     * required paramater <sites> = name or array of site names
     * optional parameter <start> = Unix timestamp in seconds
     * optional parameter <end>   = Unix timestamp in seconds
     *
     * NOTES:
     * - defaults to the past 52*7*24 hours
     * - "bytes" are no longer returned with controller version 4.9.1 and later
     */
    _self.getDailySiteStats = function (sites, cb, start, end) {
        if (typeof (end) === 'undefined')
            end = Math.floor(Date.now() / 1000);

        if (typeof (start) === 'undefined')
            start = end - (52 * 7 * 24 * 3600);

        var json = {
            attrs: ['bytes',
                'wan-tx_bytes',
                'wan-rx_bytes',
                'wlan_bytes',
                'num_sta',
                'lan-num_sta',
                'wlan-num_sta',
                'time'],
            start: start,
            end: end
        };

        _self._request('/api/s/<SITE>/stat/report/daily.site', json, sites, cb);
    };

    /**
     * Hourly site stats method - stat_hourly_site()
     * ------------------------
     *
     * required paramater <sites> = name or array of site names
     * optional parameter <start> = Unix timestamp in seconds
     * optional parameter <end>   = Unix timestamp in seconds
     *
     * NOTES:
     * - defaults to the past 7*24 hours
     * - "bytes" are no longer returned with controller version 4.9.1 and later
     */
    _self.getHourlySiteStats = function (sites, cb, start, end) {
        if (typeof (end) === 'undefined')
            end = Math.floor(Date.now() / 1000);

        if (typeof (start) === 'undefined')
            start = end - (7 * 24 * 3600);

        var json = {
            attrs: ['bytes',
                'wan-tx_bytes',
                'wan-rx_bytes',
                'wlan_bytes',
                'num_sta',
                'lan-num_sta',
                'wlan-num_sta',
                'time'],
            start: start,
            end: end
        };

        _self._request('/api/s/<SITE>/stat/report/hourly.site', json, sites, cb);
    };

    /**
     * Hourly stats method for all access points - stat_hourly_aps()
     * -----------------------------------------
     *
     * required paramater <sites> = name or array of site names
     * optional parameter <start> = Unix timestamp in seconds
     * optional parameter <end>   = Unix timestamp in seconds
     *
     * NOTES:
     * - defaults to the past 7*24 hours
     * - UniFi controller does not keep these stats longer than 5 hours with versions < 4.6.6
     */
    _self.getHourlyApStats = function (sites, cb, start, end) {
        if (typeof (end) === 'undefined')
            end = Math.floor(Date.now() / 1000);

        if (typeof (start) === 'undefined')
            start = end - (7 * 24 * 3600);

        var json = {
            attrs: ['bytes',
                'num_sta',
                'time'],
            start: start,
            end: end
        };

        _self._request('/api/s/<SITE>/stat/report/hourly.ap', json, sites, cb);
    };

    /**
     * Daily stats method for all access points - stat_daily_aps()
     * ----------------------------------------
     *
     * required paramater <sites> = name or array of site names
     * optional parameter <start> = Unix timestamp in seconds
     * optional parameter <end>   = Unix timestamp in seconds
     *
     * NOTES:
     * - defaults to the past 7*24 hours
     * - UniFi controller does not keep these stats longer than 5 hours with versions < 4.6.6
     */
    _self.getDailyApStats = function (sites, cb, start, end) {
        if (typeof (end) === 'undefined')
            end = Math.floor(Date.now() / 1000);

        if (typeof (start) === 'undefined')
            start = end - (7 * 24 * 3600);

        var json = {
            attrs: ['bytes',
                'num_sta',
                'time'],
            start: start,
            end: end
        };

        _self._request('/api/s/<SITE>/stat/report/daily.ap', json, sites, cb);
    };

    /**
     * Show all login sessions - stat_sessions()
     * -----------------------
     *
     * required paramater <sites> = name or array of site names
     * optional parameter <start> = Unix timestamp in seconds
     * optional parameter <end>   = Unix timestamp in seconds
     * optional parameter <mac>   = client MAC address to return sessions for (can only be used when start and end are also provided)
     *
     * NOTES:
     * - defaults to the past 7*24 hours
     */
    _self.getSessions = function (sites, cb, start, end, mac) {
        if (typeof (end) === 'undefined')
            end = Math.floor(Date.now() / 1000);

        if (typeof (start) === 'undefined')
            start = end - (7 * 24 * 3600);

        var json = {
            type: 'all',
            start: start,
            end: end
        };

        if (typeof (mac) !== 'undefined')
            json.mac = mac.toLowerCase();

        _self._request('/api/s/<SITE>/stat/session', json, sites, cb);
    };

    /**
     * Show latest 'n' login sessions for a single client device - stat_sta_sessions_latest()
     * ---------------------------------------------------------
     *
     * required paramater <sites> = name or array of site names
     * required parameter <mac>   = client MAC address
     * optional parameter <limit> = maximum number of sessions to get (defaults to 5)
     *
     */
    _self.getLatestSessions = function (sites, mac, cb, limit) {
        if (typeof (limit) === 'undefined')
            limit = 5;

        var json = {
            mac: mac.toLowerCase(),
            _limit: limit,
            _sort: '-assoc_time'
        };

        _self._request('/api/s/<SITE>/stat/session', json, sites, cb);
    };

    /**
     * Show all authorizations - stat_auths()
     * -----------------------
     *
     * optional parameter <start> = Unix timestamp in seconds
     * optional parameter <end>   = Unix timestamp in seconds
     *
     * NOTES:
     * - defaults to the past 7*24 hours
     */
    _self.getAllAuthorizations = function (sites, cb, start, end) {
        if (typeof (end) === 'undefined')
            end = Math.floor(Date.now() / 1000);

        if (typeof (start) === 'undefined')
            start = end - (7 * 24 * 3600);

        _self._request('/api/s/<SITE>/stat/authorization', { start: start, end: end }, sites, cb);
    };

    /**
     * List all client devices ever connected to the site - stat_allusers()
     * --------------------------------------------------
     *
     * optional parameter <historyhours> = hours to go back (default is 8760 hours or 1 year)
     *
     * NOTES:
     * - <historyhours> is only used to select clients that were online within that period,
     *    the returned stats per client are all-time totals, irrespective of the value of <historyhours>
     */
    _self.getAllUsers = function (sites, cb, within) {
        if (typeof (within) === 'undefined')
            within = 8760;

        var json = {
            type: 'all',
            conn: 'all',
            within: within
        };

        _self._request('/api/s/<SITE>/stat/alluser', json, sites, cb, 'POST');
    };

    /**
     * List all blocked client devices ever connected to the site
     * ----------------------------------------------------------
     *
     * optional parameter <historyhours> = hours to go back (default is 8760 hours or 1 year)
     *
     * NOTES:
     * - <historyhours> is only used to select clients that were online within that period,
     *    the returned stats per client are all-time totals, irrespective of the value of <historyhours>
     */
    _self.getBlockedUsers = function (sites, cb, within) {
        if (typeof (within) === 'undefined')
            within = 8760;

        var json = {
            type: 'blocked',
            conn: 'all',
            within: within
        };

        _self._request('/api/s/<SITE>/stat/alluser', json, sites, cb, 'POST');
    };

    /**
     * List guest devices - list_guests()
     * ------------------
     *
     * optional parameter <within> = time frame in hours to go back to list guests with valid access (default = 24*365 hours)
     *
     */
    _self.getGuests = function (sites, cb, within) {
        if (typeof (within) === 'undefined')
            within = 8760;

        _self._request('/api/s/<SITE>/stat/guest', { within: within }, sites, cb);
    };

    /**
     * List online client device(s) - list_clients()
     * ----------------------------
     * returns an array of online client device objects, or in case of a single device request, returns a single client device object
     *
     * required paramater <sites>   = name or array of site names
     * optional parameter <client_mac> = the MAC address of a single online client device for which the call must be made
     */
    _self.getClientDevices = function (sites, cb, client_mac) {
        if (typeof (client_mac) === 'undefined')
            client_mac = '';

        _self._request('/api/s/<SITE>/stat/sta/' + client_mac.trim().toLowerCase(), null, sites, cb);
    };

    /**
     * Get data for a single client device - stat_client()
     * -----------------------------------
     *
     * required paramater <sites>   = name or array of site names
     * optional parameter <client_mac> = the MAC address of a single online client device for which the call must be made
     */
    _self.getClientDevice = function (sites, cb, client_mac) {
        if (typeof (client_mac) === 'undefined')
            client_mac = '';

        _self._request('/api/s/<SITE>/stat/user/' + client_mac.trim().toLowerCase(), null, sites, cb);
    };

    /**
     * List user groups - list_usergroups()
     * ----------------
     *
     * required paramater <sites>   = name or array of site names
     */
    _self.getUserGroups = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/usergroup', null, sites, cb);
    };

    /**
     * Assign user device to another group - set_usergroup()
     * -----------------------------------
     *
     * required paramater <sites>    = name or array of site names
     * required parameter <user_id>  = id of the user device to be modified
     * required parameter <group_id> = id of the user group to assign user to
     *
     */
    _self.setUserGroup = function (sites, user_id, group_id, cb) {
        _self._request('/api/s/<SITE>/upd/user/' + user_id.trim(), { usergroup_id: group_id }, sites, cb);
    };

    /**
     * Edit user group - edit_usergroup()
     * ---------------
     * returns an array containing a single object with attributes of the updated usergroup on success
     *
     * required paramater <sites>      = name or array of site names
     * required parameter <group_id>   = id of the user group
     * required parameter <site_id>    = id of the site
     * required parameter <group_name> = name of the user group
     * optional parameter <group_dn>   = limit download bandwidth in Kbps (default = -1, which sets bandwidth to unlimited)
     * optional parameter <group_up>   = limit upload bandwidth in Kbps (default = -1, which sets bandwidth to unlimited)
     *
     */
    _self.editUserGroup = function (sites, group_id, site_id, group_name, cb,
        group_dn, group_up) {
        var json = {
            _id: group_id,
            site_id: site_id,
            name: group_name,
            qos_rate_max_down: typeof (group_dn) !== 'undefined' ? group_dn : -1,
            qos_rate_max_up: typeof (group_up) !== 'undefined' ? group_up : -1
        };

        _self._request('/api/s/<SITE>/rest/usergroup/' + group_id.trim(), json, sites, cb);
    };

    /**
     * Add user group - add_usergroup()
     * --------------
     * returns an array containing a single object with attributes of the new usergroup ("_id", "name", "qos_rate_max_down", "qos_rate_max_up", "site_id") on success
     *
     * required paramater <sites>      = name or array of site names
     * required parameter <group_name> = name of the user group
     * optional parameter <group_dn>   = limit download bandwidth in Kbps (default = -1, which sets bandwidth to unlimited)
     * optional parameter <group_up>   = limit upload bandwidth in Kbps (default = -1, which sets bandwidth to unlimited)
     *
     */
    _self.addUserGroup = function (sites, group_name, cb,
        group_dn, group_up) {
        var json = {
            name: group_name,
            qos_rate_max_down: typeof (group_dn) !== 'undefined' ? group_dn : -1,
            qos_rate_max_up: typeof (group_up) !== 'undefined' ? group_up : -1
        };

        _self._request('/api/s/<SITE>/rest/usergroup', json, sites, cb);
    };

    /**
     * Delete user group - delete_usergroup()
     * -----------------
     * returns true on success
     *
     * required paramater <sites>    = name or array of site names
     * required parameter <group_id> = id of the user group
     *
     */
    _self.deleteUserGroup = function (sites, group_id, cb) {
        _self._request('/api/s/<SITE>/rest/usergroup/' + group_id.trim(), null, sites, cb, 'DELETE');
    };

    /**
     * List health metrics - list_health()
     * -------------------
     *
     * required paramater <sites> = name or array of site names
     */
    _self.getHealth = function (sites, cb) {
        _self._request('/api/s/<SITE>/stat/health', null, sites, cb);
    };

    /**
     * List dashboard metrics - list_dashboard()
     * ----------------------
     *
     * required paramater <sites> = name or array of site names
     */
    _self.getDashboard = function (sites, cb) {
        _self._request('/api/s/<SITE>/stat/dashboard', null, sites, cb);
    };

    /**
     * List user devices - list_users()
     * -----------------
     *
     * required paramater <sites> = name or array of site names
     */
    _self.getUsers = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/user', null, sites, cb);
    };

    /**
     * Update device settings, base (using REST)
     * -----------------------------------------
     * required paramater <sites>           = name or array of site names
     * required parameter <device_id>       = 24 char string; _id of the device which can be found with the getAccessDevices() function
     * required parameter <device_settings> = object containing the configuration to apply to the device, must be a
     *                                        (partial) object structured in the same manner as is returned by getAccessDevices() for the devic$
     * optional paramater <cb>              = the callback function that is called with the results
     */
    _self.setDeviceSettingsBase = function (sites, device_id, deviceSettings, cb) {
        _self._request('/api/s/<SITE>/rest/device/' + device_id, deviceSettings, sites, cb, 'PUT');
    };

    /**
     * List access points and other devices under management of the controller (USW and/or USG devices) - list_devices()
     * ------------------------------------------------------------------------------------------------
     *
     * required paramater <sites>      = name or array of site names
     * optional paramater <device_mac> = the MAC address of a single device for which the call must be made
     */
    _self.getAccessDevices = function (sites, cb, device_mac) {
        if (typeof (device_mac) === 'undefined')
            device_mac = '';

        _self._request('/api/s/<SITE>/stat/device/' + device_mac.trim().toLowerCase(), null, sites, cb);
    };

    /**
     * List rogue access points - list_rogueaps()
     * ------------------------
     *
     * optional parameter <within> = hours to go back to list discovered "rogue" access points (default = 24 hours)
     *
     */
    _self.getRogueAccessPoints = function (sites, cb, within) {
        if (typeof (within) === 'undefined')
            within = 24;

        _self._request('/api/s/<SITE>/stat/rogueap', { within: within }, sites, cb);
    };

    /**
     * List sites
     * ----------
     * calls callback function(err, result) with an array of the sites
     * registered to the UniFi controller
     */
    _self.getSites = function (cb) {
        _self._request('/api/self/sites', null, null, cb);
    };

    /**
     * List sites stats
     * ----------------
     * calls callback function(err, result) with an array of sysinfo information
     * for all sites registered to the UniFi controller
     *
     * NOTES: endpoint was introduced with controller version 5.2.9
     */
    _self.getSitesStats = function (cb) {
        _self._request('/api/stat/sites', null, null, cb);
    };

    /**
     * Add a site - add_site()
     * ----------
     *
     * required parameter <description> = the long name for the new site
     *
     * NOTES: immediately after being added, the new site will be available in the output of the "list_sites" function
     */
    _self.addSite = function (site, cb, description) {
        if (typeof (description) === 'undefined')
            description = '';

        var json = {
            desc: description,
            cmd: 'add-site'
        };

        _self._request('/api/s/<SITE>/cmd/sitemgr', json, site, cb);
    };

    /**
     * Delete a site - delete_site()
     * -------------
     *
     * required parameter <site_id> = 24 char string; _id of the site to delete
     *
     */
    _self.deleteSite = function (site_id, cb) {
        // lets get the _id first
        _self.getSites(function (err, result) {
            if (!err && result && result.length > 0) {
                // only if name or _id matches the site paramater
                if (result[0].name === site_id || result[0]._id === site_id) {
                    var json = {
                        site: result[0]._id,
                        cmd: 'delete-site'
                    };

                    _self._request('/api/s/<SITE>/cmd/sitemgr', json, result[0].name, cb);
                }
            }
        });
    };

    /**
     * List admins - list_admins()
     * -----------
     *
     * required paramater <sites> = name or array of site names
     *
     */
    _self.listAdmins = function (sites, cb) {
        _self._request('/api/s/<SITE>/cmd/sitemgr', { cmd: 'get-admins' }, sites, cb);
    };

    /**
     * List wlan_groups - list_wlan_groups()
     * ----------------
     *
     * required paramater <sites> = name or array of site names
     */
    _self.getWLanGroups = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/wlangroup', null, sites, cb);
    };

    /**
     * List site sysinfo
     * -----------------
     * returns an array of known sysinfo data via callback function(err, result)
     * for all sites specified as a function parameter
     */
    _self.getSiteSysinfo = function (sites, cb) {
        _self._request('/api/s/<SITE>/stat/sysinfo', null, sites, cb);
    };

    /**
     * List self - list_self()
     * ---------
     * returns an array of information about the logged in user
     */
    _self.getSelf = function (sites, cb) {
        _self._request('/api/s/<SITE>/self', null, sites, cb);
    };

    /**
     * List networkconf - list_networkconf()
     * ----------------
     * returns an array of network configuration data
     */
    _self.getNetworkConf = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/networkconf', null, sites, cb);
    };

    /**
     * List vouchers - stat_voucher()
     * -------------
     *
     * optional parameter <create_time> = Unix timestamp in seconds
     */
    _self.getVouchers = function (sites, cb, create_time) {
        var json = {};
        if (typeof (create_time) !== 'undefined')
            json = { create_time: create_time };

        _self._request('/api/s/<SITE>/stat/voucher', json, sites, cb);
    };

    /**
     * List payments - stat_payment()
     * -------------
     * returns an array of hotspot payments
     */
    _self.getPayments = function (sites, cb, within) {
        if (typeof (within) !== 'undefined')
            within = '?within=' + within.trim();
        else
            within = '';

        _self._request('/api/s/<SITE>/stat/payment' + within, null, sites, cb);
    };

    /**
     * Create hotspot operator - create_hotspotop()
     * -----------------------
     *
     * required parameter <name>       = name for the hotspot operator
     * required parameter <x_password> = clear text password for the hotspot operator
     * optional parameter <note>       = note to attach to the hotspot operator
     */
    _self.createHotspotOperator = function (sites, name, x_password, cb, note) {
        var json = {
            name: name,
            x_password: x_password
        };

        if (typeof (note) !== 'undefined')
            json.note = note;

        _self._request('/api/s/<SITE>/rest/hotspotop', json, sites, cb);
    };

    /**
     * List hotspot operators - list_hotspotop()
     * ----------------------
     * returns an array of hotspot operators
     */
    _self.getHotspotOperators = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/hotspotop', null, sites, cb);
    };

    /**
     * Create voucher(s) - create_voucher()
     * -----------------
     * returns an array of voucher codes (without the dash "-" in the middle) by calling the stat_voucher method
     *
     * required parameter <minutes> = minutes the voucher is valid after activation (expiration time)
     * optional parameter <count>   = number of vouchers to create, default value is 1
     * optional parameter <quota>   = single-use or multi-use vouchers, string value '0' is for multi-use, '1' is for single-use, "n" is for multi-use n times
     * optional parameter <note>    = note text to add to voucher when printing
     * optional parameter <up>      = upload speed limit in kbps
     * optional parameter <down>    = download speed limit in kbps
     * optional parameter <mbytes>  = data transfer limit in MB
     */
    _self.createVouchers = function (sites, minutes, cb, count, quota, note, up, down, mbytes) {
        if (typeof (count) === 'undefined') count = 1;
        if (typeof (quota) === 'undefined') quota = 0;

        var json = {
            cmd: 'create-voucher',
            expire: minutes,
            n: count,
            quota: quota
        };

        if (typeof (note) !== 'undefined') json.note = note;
        if (typeof (up) !== 'undefined') json.up = up;
        if (typeof (down) !== 'undefined') json.down = down;
        if (typeof (mbytes) !== 'undefined') json.bytes = mbytes;

        _self._request('/api/s/<SITE>/cmd/hotspot', json, sites, cb);
    };

    /**
     * Revoke voucher - revoke_voucher()
     *---------------
     * return TRUE on success
     *
     * required parameter <voucher_id> = 24 char string; _id of the voucher to revoke
     */
    _self.revokeVoucher = function (sites, voucher_id, cb) {
        var json = {
            cmd: 'delete-voucher',
            _id: voucher_id
        };

        _self._request('/api/s/<SITE>/cmd/hotspot', json, sites, cb);
    };

    /**
     * Extend guest validity - extend_guest_validity()
     * ---------------------
     * return TRUE on success
     *
     * required parameter <guest_id> = 24 char string; _id of the guest to extend validity
     */
    _self.extendGuestValidity = function (sites, guest_id, cb) {
        var json = {
            cmd: 'extend',
            _id: guest_id
        };

        _self._request('/api/s/<SITE>/cmd/hotspot', json, sites, cb);
    };

    /**
     * List port forwarding stats - list_portforward_stats()
     * --------------------------
     * returns an array of port forwarding stats
     */
    _self.getPortForwardingStats = function (sites, cb) {
        _self._request('/api/s/<SITE>/stat/portforward', null, sites, cb);
    };

    /**
     * List DPI stats - list_dpi_stats()
     * --------------
     * returns an array of DPI stats
     */
    _self.getDPIStats = function (sites, cb) {
        _self._request('/api/s/<SITE>/stat/dpi', null, sites, cb);
    };

    /**
     * clear DPI stats
     * --------------
     * clears stats of DPI
     */
    _self.ClearDPIStatus = function (sites, cb) {
        var json = {
            cmd: 'clear-dpi'
        };
        _self._request('/api/s/<SITE>/cmd/stat', json, sites, cb);
    };

    /**
     * List current channels - list_current_channels()
     * ---------------------
     * returns an array of currently allowed channels
     */
    _self.getCurrentChannels = function (sites, cb) {
        _self._request('/api/s/<SITE>/stat/current-channel', null, sites, cb);
    };

    /**
     * List port forwarding settings - list_portforwarding()
     * -----------------------------
     * returns an array of port forwarding settings
     */
    _self.getPortForwarding = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/portforward', null, sites, cb);
    };

    /**
     * List dynamic DNS settings - list_dynamicdns()
     * -------------------------
     * returns an array of dynamic DNS settings
     */
    _self.getDynamicDNS = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/dynamicdns', null, sites, cb);
    };

    /**
     * List port configuration - list_portconf()
     * -----------------------
     * returns an array of port configurations
     */
    _self.getPortConfig = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/portconf', null, sites, cb);
    };

    /**
     * List VoIP extensions - list_extensions()
     * --------------------
     * returns an array of VoIP extensions
     */
    _self.getVoipExtensions = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/extension', null, sites, cb);
    };

    /**
     * List site settings - list_settings()
     * ------------------
     * returns an array of site configuration settings
     */
    _self.getSiteSettings = function (sites, cb) {
        _self._request('/api/s/<SITE>/get/setting', null, sites, cb);
    };

    /**
     * Adopt a device to the selected site - adopt_device()
     * -----------------------------------
     *
     * required parameter <mac> = device MAC address
     */
    _self.adoptDevice = function (sites, mac, cb) {
        var json = {
            cmd: 'adopt',
            mac: mac.toLowerCase()
        };

        _self._request('/api/s/<SITE>/cmd/devmgr', json, sites, cb);
    };

    /**
     * Reboot an access point - restart_ap()
     * ----------------------
     *
     * required parameter <mac> = device MAC address
     */
    _self.rebootAccessPoint = function (sites, mac, cb) {
        var json = {
            cmd: 'restart',
            mac: mac.toLowerCase()
        };

        _self._request('/api/s/<SITE>/cmd/devmgr', json, sites, cb);
    };

    /**
     * Disable/enable an access point - disable_ap()
     * ------------------------------
     *
     * required parameter <device_id>   = 24 char string; value of _id for the access point which can be obtained from the device list
     * required parameter <disable> = boolean; TRUE will disable the device, FALSE will enable the device
     *
     * NOTES:
     * - a disabled device will be excluded from the dashboard status and device count and its LED and WLAN will be turned off
     * - appears to only be supported for access points
     * - available since controller versions 5.2.X
     */
    _self.disableAccessPoint = function (sites, device_id, disable, cb) {
        _self._request('/api/s/<SITE>/rest/device/' + device_id.trim(), { disabled: disable }, sites, cb, 'PUT');
    };

    /**
     * Override LED mode for a device - led_override()
     * ------------------------------
     *
     * required parameter <device_id>     = 24 char string; value of _id for the device which can be obtained from the device list
     * required parameter <override_mode> = string, off/on/default; "off" will disable the LED of the device,
     *                                      "on" will enable the LED of the device,
     *                                      "default" will apply the site-wide setting for device LEDs
     */
    _self.setLEDOverride = function (sites, device_id, override_mode, cb,) {
        _self._request('/api/s/<SITE>/rest/device/' + device_id.trim(), { led_override: override_mode }, sites, cb, 'PUT');
    };

    /**
     * Toggle flashing LED of an access point for locating purposes - locate_ap()
     * ------------------------------------------------------------
     *
     * required parameter <mac> = device MAC address
     * required parameter <enable> = boolean; true will enable flashing LED, false will disable
     */
    _self.setLocateAccessPoint = function (sites, mac, enable, cb) {
        var json = {
            cmd: enable === true ? 'set-locate' : 'unset-locate',
            mac: mac.toLowerCase()
        };

        _self._request('/api/s/<SITE>/cmd/devmgr', json, sites, cb);
    };

    /**
     * Toggle LEDs of all the access points ON or OFF - site_leds()
     * ----------------------------------------------
     *
     * required parameter <enable> = boolean; true will switch LEDs of all the access points ON, false will switch them OFF
     */
    _self.setSiteLEDs = function (sites, enable, cb) {
        _self._request('/api/s/<SITE>/set/setting/mgmt', { led_enabled: enable }, sites, cb);
    };

    /**
     * Set access point radio settings - set_ap_radiosettings()
     * ------------------------------
     *
     * required parameter <ap_id>   = value of _id for the access point which can be obtained from the device list
     * required parameter <radio>   = (default=ng)
     * required parameter <channel>
     * required parameter <ht>      = (default=20)
     * required parameter <tx_power_mode>
     * required parameter <tx_power>= (default=0)
     *
     */
    _self.setAccessPointRadioSettings = function (sites, ap_id, radio, channel, ht, tx_power_mode, tx_power, cb) {
        var json = {
            radio_table: [{
                radio: radio,
                channel: channel,
                ht: ht,
                tx_power_mode: tx_power_mode,
                tx_power: tx_power
            }]
        };

        _self._request('/api/s/<SITE>/upd/device/' + ap_id.trim(), json, sites, cb);
    };

    /**
     * Set guest login settings - set_guestlogin_settings()
     * ------------------------
     *
     * required parameter <portal_enabled>
     * required parameter <portal_customized>
     * required parameter <redirect_enabled>
     * required parameter <redirect_url>
     * required parameter <x_password>
     * required parameter <expire_number>
     * required parameter <expire_unit>
     * required parameter <site_id>
     *
     * NOTES:
     * - both portal parameters are set to the same value!
     *
     */
    _self.setGuestLoginSettings = function (sites, portal_enabled, portal_customized, redirect_enabled, redirect_url, x_password, expire_number, expire_unit, site_id, cb) {
        var json = {
            portal_enabled: portal_enabled,
            portal_customized: portal_customized,
            redirect_enabled: redirect_enabled,
            redirect_url: redirect_url,
            x_password: x_password,
            expire_number: expire_number,
            expire_unit: expire_unit,
            site_id: site_id
        };

        _self._request('/api/s/<SITE>/set/setting/guest_access/', json, sites, cb);
    };

    /**
     * Rename access point - rename_ap()
     * -------------------
     *
     * required parameter <ap_id>  = value of _id for the access point which can be obtained from the device list
     * required parameter <apname> = New name
     *
     */
    _self.renameAccessPoint = function (sites, ap_id, apname, cb) {
        _self._request('/api/s/<SITE>/upd/device/' + ap_id.trim(), { name: apname }, sites, cb);
    };

    /**
     * Add a wlan - create_wlan()
     * ----------
     *
     * required parameter <name>             = string; SSID
     * required parameter <x_passphrase>     = string; new pre-shared key, minimal length is 8 characters, maximum length is 63
     * required parameter <usergroup_id>     = string; user group id that can be found using the list_usergroups() function
     * required parameter <wlangroup_id>     = string; wlan group id that can be found using the list_wlan_groups() function
     * optional parameter <enabled>          = boolean; enable/disable wlan
     * optional parameter <hide_ssid>        = boolean; hide/unhide wlan SSID
     * optional parameter <is_guest>         = boolean; apply guest policies or not
     * optional parameter <security>         = string; security type
     * optional parameter <wpa_mode>         = string; wpa mode (wpa, wpa2, ..)
     * optional parameter <wpa_enc>          = string; encryption (auto, ccmp)
     * optional parameter <vlan_enabled>     = boolean; enable/disable vlan for this wlan
     * optional parameter <vlan>             = string; vlan id
     * optional parameter <uapsd_enabled>    = boolean; enable/disable Unscheduled Automatic Power Save Delivery
     * optional parameter <schedule_enabled> = boolean; enable/disable wlan schedule
     * optional parameter <schedule>         = string; schedule rules
     */
    _self.createWLan = function (sites, name, x_passphrase, usergroup_id, wlangroup_id, cb,
        enabled, hide_ssid, is_guest, security, wpa_mode, wpa_enc, vlan_enabled, vlan, uapsd_enabled, schedule_enabled, schedule) {
        var json = {
            name: name,
            x_passphrase: x_passphrase,
            usergroup_id: usergroup_id,
            wlangroup_id: wlangroup_id,
            enabled: typeof (enabled) !== 'undefined' ? enabled : true,
            hide_ssid: typeof (hide_ssid) !== 'undefined' ? hide_ssid : false,
            is_guest: typeof (is_guest) !== 'undefined' ? is_guest : false,
            security: typeof (security) !== 'undefined' ? security : 'open',
            wpa_mode: typeof (wpa_mode) !== 'undefined' ? wpa_mode : 'wpa2',
            wpa_enc: typeof (wpa_enc) !== 'undefined' ? wpa_enc : 'ccmp',
            vlan_enabled: typeof (vlan_enabled) !== 'undefined' ? vlan_enabled : false,
            uapsd_enabled: typeof (uapsd_enabled) !== 'undefined' ? uapsd_enabled : false,
            schedule_enabled: typeof (schedule_enabled) !== 'undefined' ? schedule_enabled : false,
            schedule: typeof (schedule) !== 'undefined' ? schedule : {}
        };

        if (typeof (vlan) !== 'undefined' && typeof (vlan_enabled) !== 'undefined')
            json.vlan = vlan;

        _self._request('/api/s/<SITE>/add/wlanconf/', json, sites, cb);
    };

    /**
     * Delete wlan - delete_wlan()
     * -----------
     *
     * required parameter <wlan_id> = 24 char string; _id of the wlan that can be found with the list_wlanconf() function
     */
    _self.deleteWLan = function (sites, wlan_id, cb) {
        _self._request('/api/s/<SITE>/del/wlanconf/' + wlan_id.trim(), {}, sites, cb);
    };

    /**
     * Set wlan settings - set_wlansettings()
     * -----------------
     *
     * required parameter <wlan_id>
     * optional parameter <x_passphrase> = new pre-shared key, minimal length is 8 characters, maximum length is 63,
     *                                     will be ignored if set to null
     * optional parameter <name>
     *
     */
    _self.setWLanSettings = function (sites, wlan_id, cb, x_passphrase, name) {
        var json = {};

        if (typeof (x_passphrase) !== 'undefined')
            json.x_passphrase = x_passphrase.trim();

        if (typeof (name) !== 'undefined')
            json.name = name.trim();

        _self._request('/api/s/<SITE>/upd/wlanconf/' + wlan_id.trim(), json, sites, cb);
    };

    /**
     * Set wlan password
     * -----------------
     *
     * required parameter <wlan_id>
     * required parameter <x_passphrase> = new pre-shared key, minimal length is 8 characters, maximum length is 63.
     */
    _self.setWLanPassword = function (sites, wlan_id, x_passphrase, cb) {
        var json = {};

        if (typeof (x_passphrase) !== 'undefined') {
            if (typeof (wlan_id) == 'undefined') {
                cb({ message: 'Parameter wlan_id is missing' });
            } else {
                json.x_passphrase = x_passphrase.trim();
                _self._request('/api/s/<SITE>/upd/wlanconf/' + wlan_id.trim(), json, sites, cb);
            }
        } else {
            cb({ message: 'Parameter x_passphrase is missing' });
        }
    };

    /**
     * Disable/Enable wlan - disable_wlan()
     * -------------------
     *
     * required parameter <wlan_id>
     * required parameter <disable> = boolean; true disables the wlan, false enables it
     *
     */
    _self.disableWLan = function (sites, wlan_id, disable, cb) {
        var json = { enabled: disable == true ? false : true };

        _self._request('/api/s/<SITE>/rest/wlanconf/' + wlan_id.trim(), json, sites, cb, 'PUT');
    };


    /**
     * Disable/Enable portforwarding - disable_portforward()
     * -------------------
     *
     * required parameter <portforward_id>
     * required parameter <disable> = boolean; true disables the portforward, false enables it
     *
     */
    _self.disablePortForward = function (sites, portforward_id, disable, cb) {
        var json = { enabled: disable == true ? false : true };

        _self._request('/api/s/<SITE>/rest/portforward/' + portforward_id.trim(), json, sites, cb, 'PUT');
    };

    /**
     * List events - list_events()
     * -----------
     *
     * required paramater <sites>   = name or array of site names
     * optional parameter <historyhours> = hours to go back, default value is 720 hours
     * optional parameter <start>        = which event number to start with (useful for paging of results), default value is 0
     * optional parameter <limit>        = number of events to return, default value is 3000
     */
    _self.getEvents = function (sites, cb, historyhours, start, limit) {
        var json = {
            _sort: '-time',
            type: null
        };

        if (typeof (historyhours) !== 'undefined')
            json.within = historyhours;
        else
            json.within = 720;

        if (typeof (start) !== 'undefined')
            json._start = start;
        else
            json._start = 0;

        if (typeof (limit) !== 'undefined')
            json._limit = limit;
        else
            json._limit = 3000;

        _self._request('/api/s/<SITE>/stat/event', json, sites, cb);
    };

    /**
     * List wireless settings - list_wlanconf()
     * ----------------------
     *
     * required paramater <sites>   = name or array of site names
     */
    _self.getWLanSettings = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/wlanconf', null, sites, cb);
    };

    /**
     * List wireless setting - getWLanSetting()
     * ----------------------
     *
     * required paramater <sites>   = name or array of site names
     * required parameter <wlan_id>
     */
    _self.getWLanSetting = function (sites, wlan_id, cb) {
        _self._request('/api/s/<SITE>/rest/wlanconf/' + wlan_id.trim(), null, sites, cb);
    };

    /**
     * List portforward settings - list_portforward()
     * ----------------------
     *
     * required paramater <sites>   = name or array of site names
     */
    _self.getPortForwardSettings = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/portforward', null, sites, cb);
    };

    /**
     * List alarms - list_alarms()
     * -----------
     *
     * required paramater <sites>   = name or array of site names
     */
    _self.getAlarm = function (sites, cb) {
        _self._request('/api/s/<SITE>/list/alarm', null, sites, cb);
    };

    /**
     * Count alarms - count_alarms()
     * ------------
     * returns an array containing the alarm count
     * required paramater <sites>   = name or array of site names
     * optional parameter <archived> = boolean; if true all alarms will be counted, if false only non-archived (active) alarms will be counted
     */
    _self.getAlarms = function (sites, cb, archived) {
        _self._request('/api/s/<SITE>/cnt/alarm' + archived === false ? '?archived=false' : '', null, sites, cb);
    };

    /**
     * Upgrade a device to the latest firmware - upgrade_device()
     * ---------------------------------------
     * return true on success
     * required parameter <device_mac> = MAC address of the device to upgrade
     *
     * NOTES:
     * - updates the device to the latest firmware known to the controller
     */
    _self.upgradeDevice = function (sites, device_mac, cb) {
        _self._request('/api/s/<SITE>/cmd/devmgr/upgrade', { mac: device_mac.toLowerCase() }, sites, cb);
    };

    /**
     * Upgrade a device to a specific firmware file
     * ---------------------------------------
     * return true on success
     * required parameter <firmware_url> = URL for the firmware file to upgrade the device to
     * required parameter <device_mac>   = MAC address of the device to upgrade
     *
     * NOTES:
     * - updates the device to the firmware file at the given URL
     * - please take great care to select a valid firmware file for the device!
     */
    _self.upgradeDeviceExternal = function (sites, firmware_url, device_mac, cb) {
        _self._request('/api/s/<SITE>/cmd/devmgr/upgrade-external', {
            url: firmware_url,
            mac: device_mac.toLowerCase()
        }, sites, cb);
    };

    /**
     * Trigger an RF scan by an AP
     * ---------------------------
     * return true on success
     * required parameter <ap_mac> = MAC address of the AP
     */
    _self.runSpectrumScan = function (sites, ap_mac, cb) {
        _self._request('/api/s/<SITE>/cmd/devmgr', { cmd: 'spectrum-scan', mac: ap_mac.toLowerCase() }, sites, cb);
    };

    /**
     * Check the RF scanning state of an AP
     * ------------------------------------
     * returns an object with relevant information (results if available) regarding the RF scanning state of the AP
     * required parameter <ap_mac> = MAC address of the AP
     */
    _self.getSpectrumScanState = function (sites, ap_mac, cb) {
        _self._request('/api/s/<SITE>/stat/spectrum-scan/' + ap_mac.trim().toLowerCase(), null, sites, cb);
    };

    /**
     * List Radius user accounts (5.5.19+)
     * -------------------------
     * returns an array of objects containing all Radius accounts for the current site
     *
     * NOTES:
     * - this function/method is only supported on controller versions 5.5.19 and later
     */
    _self.listRadiusAccounts = function (sites, cb) {
        _self._request('/api/s/<SITE>/rest/account', null, sites, cb);
    };

    /**
    * List Radius profiles (using REST) - list_radius_profiles()
    *
    * returns an array of objects containing all Radius profiles for the current site
    *
    * NOTES:
    * - this function/method is only supported on controller versions 5.5.19 and later
    */
    _self.listRadiusProfiles = function (sites, cb) {
        _self._request('/api/s/<SITE>/rest/radiusprofile', null, sites, cb);
    };

    /**
    * Create a Radius user (using REST) - create_radius_account()
    *
    * NOTES:
    * - this function/method is only supported on controller versions 5.5.19 and later
    *
    * required parameter <name> = name for the new user
    * required parameter <x_password> = password for the new user
    * optional parameter <tunnel_type> =  INT; must be one of the following values:
    *                                    1      Point-to-Point Tunneling Protocol (PPTP)
    *                                    2      Layer Two Forwarding (L2F)
    *                                    3      Layer Two Tunneling Protocol (L2TP)
    *                                    4      Ascend Tunnel Management Protocol (ATMP)
    *                                    5      Virtual Tunneling Protocol (VTP)
    *                                    6      IP Authentication Header in the Tunnel-mode (AH)
    *                                    7      IP-in-IP Encapsulation (IP-IP)
    *                                    8      Minimal IP-in-IP Encapsulation (MIN-IP-IP)
    *                                    9      IP Encapsulating Security Payload in the Tunnel-mode (ESP)
    *                                    10     Generic Route Encapsulation (GRE)
    *                                    11     Bay Dial Virtual Services (DVS)
    *                                    12     IP-in-IP Tunneling
    *                                    13     Virtual LANs (VLAN)
    * optional parameter <tunnel_medium_type> = INT; must be one of the following values:
    *                                           1      IPv4 (IP version 4)
    *                                           2      IPv6 (IP version 6)
    *                                           3      NSAP
    *                                           4      HDLC (8-bit multidrop)
    *                                           5      BBN 1822
    *                                           6      802 (includes all 802 media plus Ethernet "canonical format")
    *                                           7      E.163 (POTS)
    *                                           8      E.164 (SMDS, Frame Relay, ATM)
    *                                           9      F.69 (Telex)
    *                                           10     X.121 (X.25, Frame Relay)
    *                                           11     IPX
    *                                           12     Appletalk
    *                                           13     Decnet IV
    *                                           14     Banyan Vines
    *                                           15     E.164 with NSAP format subaddress
    * optional parameter <vlan> = INT; VLAN to assign to the user

    */
    _self.createRadiusUser = function (sites, name, x_password, tunnel_type, tunnel_medium_type, vlan, cb) {
        var json = {
            name,
            x_password
        };
        if (tunnel_type !== null) {
            json.tunnel_type = tunnel_type;
        }
        if (tunnel_medium_type !== null) {
            json.tunnel_medium_type = tunnel_medium_type;
        }
        if (vlan !== null) {
            json.vlan = vlan;
        }
        _self._request('/api/s/<SITE>/rest/account', json, sites, cb);
    };

    /**
    * Update Radius user, base (using REST) - updateRadiusUser()
    *
    * required parameter <user_id> =  24 char string; _id of the user which can be found with the listRadiusAccounts() function
    * optional parameter <name> = name for the new user
    * optional parameter <x_password> = password for the new user
    * optional parameter <tunnel_type> =  INT; must be one of the following values:
    *                                    1      Point-to-Point Tunneling Protocol (PPTP)
    *                                    2      Layer Two Forwarding (L2F)
    *                                    3      Layer Two Tunneling Protocol (L2TP)
    *                                    4      Ascend Tunnel Management Protocol (ATMP)
    *                                    5      Virtual Tunneling Protocol (VTP)
    *                                    6      IP Authentication Header in the Tunnel-mode (AH)
    *                                    7      IP-in-IP Encapsulation (IP-IP)
    *                                    8      Minimal IP-in-IP Encapsulation (MIN-IP-IP)
    *                                    9      IP Encapsulating Security Payload in the Tunnel-mode (ESP)
    *                                    10     Generic Route Encapsulation (GRE)
    *                                    11     Bay Dial Virtual Services (DVS)
    *                                    12     IP-in-IP Tunneling
    *                                    13     Virtual LANs (VLAN)
    * optional parameter <tunnel_medium_type> = INT; must be one of the following values:
    *                                           1      IPv4 (IP version 4)
    *                                           2      IPv6 (IP version 6)
    *                                           3      NSAP
    *                                           4      HDLC (8-bit multidrop)
    *                                           5      BBN 1822
    *                                           6      802 (includes all 802 media plus Ethernet "canonical format")
    *                                           7      E.163 (POTS)
    *                                           8      E.164 (SMDS, Frame Relay, ATM)
    *                                           9      F.69 (Telex)
    *                                           10     X.121 (X.25, Frame Relay)
    *                                           11     IPX
    *                                           12     Appletalk
    *                                           13     Decnet IV
    *                                           14     Banyan Vines
    *                                           15     E.164 with NSAP format subaddress
    * optional parameter <vlan> = INT; VLAN to assign to the user
    * 
    * NOTES:
    * - this function/method is only supported on controller versions 5.5.19 and later
    */
    _self.updateRadiusUser = function (sites, user_id, name, x_password, tunnel_type, tunnel_medium_type, vlan, cb) {
        var json = {};

        if (name !== null) {
            json.name = name;
        }
        if (x_password !== null) {
            json.x_password = x_password;
        }
        if (tunnel_type !== null) {
            json.tunnel_type = tunnel_type;
        }
        if (tunnel_medium_type !== null) {
            json.tunnel_medium_type = tunnel_medium_type;
        }
        if (vlan !== null) {
            json.vlan = vlan;
        }
        _self._request('/api/s/<SITE>/rest/account/' + user_id.trim(), json, sites, cb, 'PUT');
    };

    /**
    * Delete a Radius user (using REST) - deleteRadiusUser()
    *
    * required parameter <user_id> = 24 char string; _id of the user which can be found with the listRadiusAccounts() function
    *
    * NOTES:
    * - this function/method is only supported on controller versions 5.5.19 and later
    */
    _self.deleteRadiusUser = function (sites, user_id, cb) {
        _self._request('/api/s/<SITE>/rest/account/' + user_id.trim(), null, sites, cb, 'DELETE');
    }

    /**
     * Create backup (5.4.9+)
     * -------------
     *
     * required paramater <sites>   = name or array of site names
     *
     */
    _self.createBackup = function (sites, cb) {
        _self._request('/api/s/<SITE>/cmd/backup', { cmd: 'backup' }, sites, cb);
    };

    /**
     * Upgrade External Firmware (5.4.9+)
     * -------------------------
     *
     * required paramater <sites>        = name or array of site names
     * required parameter <mac>          = device MAC address
     * required parameter <firmware_url> = external URL to firmware data
     *
     */
    _self.upgradeExternalFirmware = function (sites, mac, firmware_url, cb) {
        var json = {
            url: firmware_url,
            mac: mac.toLowerCase()
        };

        _self._request('/api/s/<SITE>/cmd/devmgr/upgrade-external', json, sites, cb);
    };

    /**
     * List firewall groups - list_firewallgroups()
     * ----------------
     *
     * required paramater <sites>   = name or array of site names
     */
    _self.getFirewallGroups = function (sites, cb) {
        _self._request('/api/s/<SITE>/rest/firewallgroup', null, sites, cb);
    };

    /**
     * Edit firewall group - edit_firewallgroup()
     * ---------------
     * returns an array containing a single object with attributes of the updated firewallgroup on success
     *
     * required paramater <sites>         = name or array of site names
     * required parameter <group_id>      = id of the firewall group
     * required parameter <site_id>       = id of the site
     * required parameter <group_name>    = name of the firewall group
     * required parameter <group_type>    = type of firewall group (address-group, ipv6-address-group or port-group)
     * optional parameter <group_members> = array of group member CIDRs/IPs or ports (default = [], which empties the group)
     *
     */
    _self.editFirewallGroup = function (sites, group_id, site_id, group_name, group_type, cb,
        group_members) {
        if (['address-group', 'ipv6-address-group', 'port-group'].includes(group_type)) {
            var json = {
                _id: group_id,
                site_id: site_id,
                name: group_name,
                group_type: group_type,
                group_members: typeof (group_members) !== 'undefined' ? group_members : []
            };

            _self._request('/api/s/<SITE>/rest/firewallgroup/' + group_id.trim(), json, sites, cb, 'PUT');
        } else
            cb({ message: `Invalid group_type: ${group_type}` });
    };

    /**
     * Add firewall group - add_firewallgroup()
     * --------------
     * returns an array containing a single object with attributes of the new firewallgroup ("_id", "name", "group_type", "group_members", "site_id") on success
     *
     * required paramater <sites>         = name or array of site names
     * required parameter <group_name>    = name of the firewall group
     * required parameter <group_type>    = type of firewall group (address-group, ipv6-address-group or port-group)
     * optional parameter <group_members> = array of group member CIDRs/IPs or ports (default = [], which creates an empty group)
     *
     */
    _self.addFirewallGroup = function (sites, group_name, group_type, cb,
        group_members) {
        if (['address-group', 'ipv6-address-group', 'port-group'].includes(group_type)) {
            var json = {
                name: group_name,
                group_type: group_type,
                group_members: typeof (group_members) !== 'undefined' ? group_members : []
            };

            _self._request('/api/s/<SITE>/rest/firewallgroup', json, sites, cb);
        } else
            cb({ message: `Invalid group_type: ${group_type}` });
    };

    /**
     * Delete firewall group - delete_firewallgroup()
     * -----------------
     * returns true on success
     *
     * required paramater <sites>    = name or array of site names
     * required parameter <group_id> = id of the firewall group
     *
     */
    _self.deleteFirewallGroup = function (sites, group_id, cb) {
        _self._request('/api/s/<SITE>/rest/firewallgroup/' + group_id.trim(), null, sites, cb, 'DELETE');
    };

    /**
     * List firewall rules - getFirewallRules()
     * ----------------
     *
     * required paramater <sites>   = name or array of site names
     */
    _self.getFirewallRules = function (sites, cb) {
        _self._request('/api/s/<SITE>/rest/firewallrule', null, sites, cb);
    };

    /**
     * Get firewall rule - getFirewallRule()
     * ----------------
     *
     * required parameter <rule_id>  = 24 char string; value of _id for the device which can be obtained from the firewall rule list
     */
    _self.getFirewallRule = function (sites, rule_id, cb) {

        if (rule_id) {
            _self._request('/api/s/<SITE>/rest/firewallrule/' + rule_id.trim(), null, sites, cb);
        } else
            cb({ message: `Parameter rule_id is missing` });
    };

    /**
     * Get firewall rule by name - getFirewallRuleByName()
     * ----------------
     *
     * required parameter <rule_name>  = name of the firewall rule
     */
    _self.getFirewallRuleByName = function (sites, rule_name, cb) {
        try {
            if (rule_name) {
                _self.getFirewallRules(sites, function (err, result) {
                    if (!err && result && result.length > 0) {
                        var found = result[0].filter(rule => rule.name.toLowerCase() == rule_name.toLowerCase())
                        if (found.length > 1) {
                            cb({ message: `Found multiple rules. Please refine the rule name` });
                        } else if (found.length) {
                            cb(false, found[0]);
                        }
                    }
                })
            } else
                cb({ message: `Parameter rule_name is missing` });
        }
        catch (e) {
            cb({ message: e });
        }
    };

    /**
     * Enable / disable firewall rules - disableFirewallRule()
     * ------------------------------
     *
     * required parameter <rule_id>  = 24 char string; value of _id for the device which can be obtained from the firewall rule list
     * required parameter <enable> = boolean; true will enable firewall rule, false will disable
     */
    _self.disableFirewallRule = function (sites, rule_id, rule_enable, cb) {
        if (rule_id) {
            _self._request('/api/s/<SITE>/rest/firewallrule/' + rule_id.trim(), { enabled: rule_enable }, sites, cb, 'PUT');
        } else
            cb({ message: `Parameter rule_id is missing` });
    };

    /**
     * Get PoE state of a port - getPoePortState()
     * ------------------------------
     *
     * required parameter <device_id>  = 24 char string; value of _id for the device which can be obtained from the firewall rule list
     * required parameter <port> = integer; number of the port
     */
    _self.getPoePortState = function (sites, device_id, poe_port, cb) {
        try {

            if (device_id) {

                _self._request('/api/s/<SITE>/stat/device/', null, sites, function (err, result) {
                    if (!err && result && result.length > 0) {
                        result.forEach(device => {
                            if (device._id == device_id) {
                                if (poe_port) {
                                    device.port_table.forEach(port => {
                                        if (port.port_idx == poe_port) {
                                            cb(false, port);
                                        }
                                    });
                                } else {
                                    cb(false, device.port_table);
                                }
                            }
                        });
                    }
                });

            } else {
                cb({ message: `A mandatory parameter is missing` });
            }


        } catch (e) {
            cb({ message: e });
        }
    };

    /**
     * Enable / disable PoE
     * ------------------------------
     *
     * required parameter <device_id>  = 24 char string; value of _id for the device which can be obtained from the firewall rule list
     * required parameter <poe_port> = integer; number of the port
     * required parameter <poe_mode> = 'auto', 'pasv24' or 'passthrough' will enable poe on the specified port, 'off' will disable poe on the specified port
     */
    _self.disablePoePort = function (sites, device_id, poe_port, poe_mode, cb) {
        try {

            const poe_modes = ['off', 'auto', 'pasv24', 'passthrough'];

            if (!poe_modes.includes(poe_mode)) {
                cb({ message: `Wrong PoE mode (off/auto/pasv24)` });
                return;
            }

            if (device_id && poe_port) {
                _self._request('/api/s/<SITE>/stat/device/', null, sites, function (err, result) {
                    if (!err && result && result.length > 0) {
                        result.forEach(device => {
                            if (device._id == device_id) {
                                var changed = false;
                                var newPort = true;
                                var port_overrides = [];

                                //get all current overrides
                                device.port_overrides.forEach(port => {
                                    if (port.port_idx == poe_port) {
                                        if (port.poe_mode != poe_mode) {
                                            changed = true;
                                            port.poe_mode = poe_mode;
                                        }
                                        newPort = false;
                                    }
                                    port_overrides.push(port)
                                });

                                if (newPort) {
                                    //Get information from the new port to create override
                                    device.port_table.forEach(port => {
                                        if (port.port_idx == poe_port) {
                                            port_overrides.push({ "port_idx": port.port_idx, "poe_mode": poe_mode, "portconf_id": port.portconf_id, port_security_mac_address: [], stp_port_mode: true, autoneg: true, port_security_enabled: false })
                                        }
                                    });
                                    changed = true;
                                }
                                if (changed) {
                                    _self.setPortProfiles(sites, device_id, port_overrides, cb)
                                }
                            }
                        });
                    }
                });

            } else {
                cb({ message: `A mandatory parameter is missing` });
            }


        } catch (e) {
            cb({ message: e });
        }
    };

    /**
     * Force Provision of a device
     * -----------------
     * returns true on success
     * required parameter <mac> = device MAC address
     */
    _self.forceProvision = function (sites, mac, cb) {
        var json = {
            mac: mac.toLowerCase(),
            cmd: 'force-provision',
        };

        _self._request('/api/s/<SITE>/cmd/devmgr', json, sites, cb);
    };

    /**
     * Set switch port profiles for multiple ports on the same device
     * ------------------------------
     *
     * required parameter <device_id>  = 24 char string; value of _id for the device which can be obtained from the device list
     * required parameter <port_overrides> = array of port override config objects
     */
    _self.setPortProfiles = function (sites, device_id, port_overrides, cb) {
        var json = { port_overrides: port_overrides };
        _self._request('/api/s/<SITE>/rest/device/' + device_id.trim(), json, sites, cb, 'PUT');
    }

    /**
     * Set Outlet Port State
     * ------------------------------
     *
     * required parameter <mac>  = client mac address.
     * required parameter <port_index> = integer; number of the port, starting with 1
     * optional parameter <relay_state>          = boolean; enable/disable relay
     * optional parameter <cycle_enabled>        = boolean; enable/disable cycle
     */
    _self.setOutletPortState = function (sites, mac, port_index, relay_state, cycle_state, cb) {
        try {
            if (mac && port_index) {
                _self._request('/api/s/<SITE>/stat/device/', null, sites, function (err, result) {
                    if (!err && result && result.length > 0) {
                        var matchedDevices = 0;
                        result.forEach(device => {
                            if (device.mac == mac.toLowerCase()) {
                                matchedDevices++;
                                var changed = false;
                                var outlet_overrides = [];

                                device.outlet_overrides.forEach(port => {
                                    if (port.index == port_index) {
                                        changed = true;
                                        if (typeof (relay_state) !== 'undefined') {
                                            port.relay_state = relay_state;
                                        }
                                        if (typeof (cycle_state) !== 'undefined') {
                                            port.cycle_state = cycle_state;
                                        }
                                    }
                                    outlet_overrides.push(port)
                                });
                                if (changed) {
                                    var json = { outlet_overrides: outlet_overrides };
                                    _self._request('/api/s/<SITE>/rest/device/' + device._id, json, sites, cb, 'PUT');
                                }
                            }
                        });
                        if (matchedDevices == 0) {
                            cb({ message: 'No device matched MAC Address' });
                        }
                    } else {
                        cb({ message: 'Error reading device status' });
                    }
                });

            } else {
                cb({ message: 'A mandatory parameter is missing' });
            }

        } catch (e) {
            cb({ message: e });
        }
    };

    /**
     * Enable / disable Traffic Management rules - disableTrafficManagementRule()
     * ------------------------------
     *
     * required parameter <rule_id>  = 24 char string; value of _id for the device which can be obtained from the firewall rule list
     * required parameter <enable> = boolean; true will enable firewall rule, false will disable
     */
    _self.disableTrafficManagementRule = function (sites, rule_id, rule_enable, cb) {
        try {
            if (rule_id) {
                _self._request('/v2/api/site/<SITE>/trafficrules/', null, sites, function (err, result) {
                    if (!err && result && result.length > 0) {
                        result.forEach(data => {
                            if (data._id == rule_id.toLowerCase()) {
                                if (data.enabled !== rule_enable) {
                                    data.enabled = rule_enable;
                                    _self._request('/v2/api/site/<SITE>/trafficrules/' + rule_id.trim(), data, sites, cb, 'PUT');
                                }
                            }
                        });
                    } else {
                        cb({ message: 'Error reading Traffic Management Rules' });
                    }
                });
            } else {
                cb({ message: `Parameter rule_id is missing` });
            }
        } catch (e) {
            cb({ message: e });
        }
    };

    /**
     * Get Traffic Management rules - getTrafficManagementRule()
     * ------------------------------
     *
     * optional parameter <rule_id>  = 24 char string; value of _id for the device which can be obtained from the firewall rule list
     */
    _self.getTrafficManagementRule = function (sites, rule_id, cb) {
        try {
            _self._request('/v2/api/site/<SITE>/trafficrules/', null, sites, function (err, result) {
                if (!err && result && result.length > 0) {
                    if (rule_id) {
                        var matched = false;
                        result.forEach(data => {
                            if (data._id == rule_id.toLowerCase()) {
                                matched = true;
                                cb(false, data);
                            }
                        });
                        if (!matched) {
                            cb({ message: 'Cant find Traffic Management Rule' });
                        }

                    } else {
                        cb(false, result);
                    }
                }
                else {
                    cb({ message: 'Error reading Traffic Management Rules' });
                }
            });

        } catch (e) {
            cb({ message: e });
        }
    };

    /**
     * Enable / disable Traffic Routes - disableTrafficRoute()
     * ------------------------------
     *
     * required parameter <rule_id>  = 24 char string; value of _id for the device which can be obtained from the traffic routes list
     * required parameter <enable> = boolean; true will enable traffic route rule, false will disable
     */
    _self.disableTrafficRouteRule = function (sites, rule_id, rule_enable, cb) {
        try {
            if (rule_id) {
                _self._request('/v2/api/site/<SITE>/trafficroute/', null, sites, function (err, result) {
                    if (!err && result && result.length > 0) {
                        result.forEach(data => {
                            if (data._id == rule_id.toLowerCase()) {
                                if (data.enabled !== rule_enable) {
                                    data.enabled = rule_enable;
                                    _self._request('/v2/api/site/<SITE>/trafficroute/' + rule_id.trim(), data, sites, cb, 'PUT');
                                }
                            }
                        });
                    } else {
                        cb({ message: 'Error reading Traffic Routes' });
                    }
                });
            } else {
                cb({ message: `Parameter rule_id is missing` });
            }
        } catch (e) {
            cb({ message: e });
        }
    };

    /**
     * Get Traffic Routes - getTrafficRoute()
     * ------------------------------
     *
     * optional parameter <rule_id>  = 24 char string; value of _id for the device which can be obtained from the traffic routes list
     */
    _self.getTrafficRouteRule = function (sites, rule_id, cb) {
        try {
            _self._request('/v2/api/site/<SITE>/trafficroute/', null, sites, function (err, result) {
                if (!err && result && result.length > 0) {
                    if (rule_id) {
                        var matched = false;
                        result.forEach(data => {
                            if (data._id == rule_id.toLowerCase()) {
                                matched = true;
                                cb(false, data);
                            }
                        });
                        if (!matched) {
                            cb({ message: 'Cant find Traffic Routes' });
                        }

                    } else {
                        cb(false, result);
                    }
                }
                else {
                    cb({ message: 'Error reading Traffic Routes' });
                }
            });

        } catch (e) {
            cb({ message: e });
        }
    };

    /**
     * Set WLan MAC Filter and Policy - setWLanFilter()
     * ------------------------------
     *
     * required parameter <wlan_id> = 24 char string; _id of the wlan that can be found with the list_wlanconf() function
     * required parameter <policy> = allow | deny
     * required parameter <mac> = [] Array of MAC addresses to create filter list
     */
    _self.setWLanFilter = function (sites, wlan_id, policy, mac, cb) {
        var json = {};

        if (typeof (policy) == 'undefined') {
            cb({ message: 'Parameter policy is missing' });
        } else if (typeof (wlan_id) == 'undefined') {
            cb({ message: 'Parameter wlan_id is missing' });
        } else if (typeof (mac) == 'undefined') {
            cb({ message: 'Parameter mac is missing' });
        } else {
            json.mac_filter_policy = policy.trim();
            json.mac_filter_list = mac;
            _self._request('/api/s/<SITE>/rest/wlanconf/' + wlan_id.trim(), json, sites, cb, 'PUT');
        }
    }

    /**
     * Set DHCP DNS Servers - setDNSServer()
     * ------------------------------
     *
     * required parameter <network_id> = 24 char string; _id of the network that could be found with the command getnetworkconf() function
     * optional parameter <dns1> = DNS Server IP
     * optional parameter <dns2> = DNS Server IP
     */
    _self.setDNSServer = function (sites, network_id, dns1, dns2, cb) {
        var json = {};

        if (typeof (network_id) == 'undefined') {
            cb({ message: 'Parameter network_id is missing' });
        } else if (typeof (dns1) == 'undefined' && typeof (dns2) == 'undefined') {
            cb({ message: 'Parameter dns is missing' });
        } else {

            if (typeof (dns1) !== 'undefined') {
                json.dhcpd_dns_1 = dns1;
            }
            if (typeof (dns2) !== 'undefined') {
                json.dhcpd_dns_2 = dns2;
            }

            _self._request('/api/s/<SITE>/rest/networkconf/' + network_id.trim(), json, sites, cb, 'PUT');
        }
    }

    /**
     * Override LED Color a device - setLEDColorOverride()
     * ------------------------------
     *
     * required parameter <device_id>     = 24 char string; value of _id for the device which can be obtained from the device list
     * required parameter <color> = string, Color Hex code example for red #ff0000
     */
    _self.setLEDColorOverride = function (sites, device_id, color, cb,) {
        _self._request('/api/s/<SITE>/rest/device/' + device_id.trim(), { led_override_color: color }, sites, cb, 'PUT');
    };

    //#endregion

    _self._request = function (url, json, sites, cb, method) {
        if (_self._unifios && url !== '/api/auth/login' && url !== '/api/login' && url !== '/api/auth/logout') {
            var reqjson = { url: _self._baseurl + '/proxy/network' + url.replace('<SITE>', sites) };
        }
        else {
            var reqjson = { url: _self._baseurl + url.replace('<SITE>', sites) };
        }
        reqjson.CookieJar = _self._cookieJar;

        // identify which request method we are using (GET, POST, DELETE and PUT) 
        if (typeof (method) === 'undefined') {
            if (json !== null) {
                reqjson.method = "POST";
            } else {
                reqjson.method = "GET";
            }
        } else {
            reqjson.method = method;
        }
        if (json !== null) {
            reqjson.data = json;
        }

        axiosinstance(reqjson)
            .then(function (response) {
                // handle success
                if (response.headers['x-csrf-token']) {
                    axiosinstance.defaults.headers.common['x-csrf-token'] = response.headers['x-csrf-token'];
                }
                if (typeof (cb) === 'function') {
                    if (response.data.data) {
                        cb(false, response.data.data);
                    } else {
                        cb(false, response.data);
                    }
                }
            })
            .catch(function (error) {
                // handle error
                if (_self._debug) {
                    console.log(error);
                }
                if (typeof (cb) === 'function') {
                    _self._loggedIn = false;
                    try {
                        if (error.code == 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                            cb({ message: 'Certificate error' });
                        } else if (error.response.data.code == 'AUTHENTICATION_FAILED_INVALID_CREDENTIALS') {
                            cb({ message: error.response.data.message });
                        } else if (error.response.data == 'Unauthorized') {
                            cb({ message: error.response.data });
                        } else if (error.response.status == '401') {
                            cb({ message: 'Unauthorized' });
                        } else if (error.response.data.code == 'AUTHENTICATION_FAILED_LIMIT_REACHED') {
                            cb({ message: error.response.data.message });
                        }
                        else {
                            cb({ message: error.code });
                        }
                    } catch {
                        cb({ message: 'Unknown error' });
                    }
                }
            })
            .then(function () {
                // always executed
            });
    };
};

exports.Controller = Controller;
