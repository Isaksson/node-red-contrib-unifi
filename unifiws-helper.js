const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');
const WebSocket = require('ws');

var ControllerWS = function (hostname, port, unifios, ssl, username, password, site, events) {
    var _self = this;
    _self._cookieJar = new CookieJar();
    _self._unifios = unifios;
    _self._ssl = ssl;
    _self._baseurl = 'https://127.0.0.1:8443';
    _self._username = username;
    _self._password = password;
    _self._site = site;
    _self._events = ['EVT_WU_Connected', 'EVT_WU_Disconnected', 'EVT_WU_Roam', 'EVT_WU_Roam_Radio', 'EVT_WG_Connected', 'EVT_WG_Disconnected', 'EVT_WG_Roam', 'EVT_WG_Roam_Radio', 'EVT_LU_Disconnected', 'EVT_LU_Connected'];
    if (typeof events === 'string') {
        _self.events = events.split(",").map(event => event.trim()).filter(event => event);
    }
    if (typeof (hostname) !== 'undefined' && typeof (port) !== 'undefined') {
        _self._baseurl = 'https://' + hostname + ':' + port;
    }

    const cookieJar = _self._cookieJar;
    const axiosInstance = axios.create({
        httpAgent: new HttpCookieAgent({ cookies: { jar: cookieJar } }),
        httpsAgent: new HttpsCookieAgent({ cookies: { jar: cookieJar }, rejectUnauthorized: _self._ssl, requestCert: true })
    });

    _self.connect = function(cb, trace) {
        _self.close();

        if (_self._unifios) {
            url = _self._baseurl + '/api/auth/login';
        } else {
            url = _self._baseurl + '/api/login';
        }

        const abortController = _self._axiosAbortController = new AbortController();
        axiosInstance.post(url, {
            username: _self._username,
            password: _self._password
        }, {
            signal: abortController.signal
        }).then(response => {
            if (response.headers['x-csrf-token']) {
                axiosInstance.defaults.headers.common['x-csrf-token'] = response.headers['x-csrf-token'];
            }
        }).then(() => cookieJar.getCookieString(_self._baseurl)).then(cookies => {
            const baseurl = _self._baseurl.replace('https://', 'wss://')
            var eventsUrl = baseurl + '/wss/s/<SITE>/events'.replace('<SITE>', _self._site);
            if (_self._unifios) {
                eventsUrl = baseurl + '/proxy/network/wss/s/<SITE>/events'.replace('<SITE>', _self._site);
            }

            const ws = _self._ws = new WebSocket(eventsUrl, {
                perMessageDeflate: false,
                rejectUnauthorized: _self._ssl,
                headers: {
                    Cookie: cookies
                }
            });

            ws.on('open', () => {
                if (typeof cb === 'function') {
                    cb(null, 'STATUS_CONNECTED');
                }
            });

            ws.on('message', data => {
                try {
                    trace('Received message from web socket', data);
                    const obj = JSON.parse(data);
                    if (obj.meta.message === 'events') {
                        if (_self.events.length === 0 || _self.events.indexOf(obj.data[0].key) > -1) {
                            if (typeof cb === 'function') {
                                cb(null, obj);
                            }
                        }
                    }
                } catch (err) {
                    if (typeof cb === 'function') {
                        cb(null, 'INVALID_MESSAGE');
                    }
                }
            });

            ws.on('error', err => {
                if (typeof cb === 'function') {
                    cb(err);
                }
            });

            ws.on('close', () => {
                if (typeof cb === 'function') {
                    cb(null, 'STATUS_DISCONNECTED');
                }
            });
        }).catch(err => {
            if (typeof cb === 'function') {
                cb(err);
                // also signal "disconnect", so node will attempt reconnect
                cb(null, 'STATUS_DISCONNECTED');
            }
        });
    };

    _self.close = function() {
        if (_self._axiosAbortController) {
            _self._axiosAbortController.abort();
            delete _self._axiosAbortController;
        }
        if (_self._ws) {
            _self._ws.close();
            delete _self._ws;
        }
    }
};

exports.ControllerWS = ControllerWS;