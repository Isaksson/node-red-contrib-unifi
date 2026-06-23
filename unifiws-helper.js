const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');
const WebSocket = require('ws');

let ControllerWS = function (hostname, port, unifios, ssl, username, password, site, allowedMessages, allowedEventsKey) {

    let _self = this;
    _self._cookieJar = new CookieJar();
    _self._unifios = unifios;
    _self._ssl = ssl;
    _self._baseurl = 'https://127.0.0.1:8443';
    _self._username = username;
    _self._password = password;
    _self._site = site;
    _self._ws = null;
    _self._needReconnect = true;

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

        try {
            // http POST request login to receive a cookie
            const response = await axiosinstance.post(url, {
                username: _self._username,
                password: _self._password
            })
            if (response.headers['x-csrf-token']) {
                axiosinstance.defaults.headers.common['x-csrf-token'] = response.headers['x-csrf-token'];
            }
            const cookies = await jar.getCookieString(_self._baseurl)

            // prepare websocket URL
            const queryParams = new URLSearchParams();
            // request client messages in query param
            if (allowedMessages.length === 0 || allowedMessages.includes('client:sync')) {
                queryParams.append('clients', 'v2');
            }
            const eventsUrl = _self._baseurl.replace('https://', 'wss://')+`${_self._unifios
                ? `/proxy/network/wss/s/${_self._site}/events`
                : `/wss/s/${_self._site}/events`
            }?`+queryParams.toString();

            // declare events handlers
            _self._needReconnect = true;
            function onOpenHandler() {
                cb({type: 'STATUS_CONNECTED'});
            }
            function onMessageHandler(data) {
                try {
                    const message = JSON.parse(data);
                    if (allowedMessages.length === 0) {
                        // no filter, all messages are allowed
                        cb({type: 'MESSAGE', message});
                        return;
                    }
                    if (allowedMessages.includes(message.meta.message)) {
                        // this type of message is allowed
                        if (message.meta.message === 'events') {
                            // it is an event, apply an additional filter on the event key
                            if (allowedEventsKey.includes(message.data[0].key)) {
                                cb({type: 'MESSAGE', message});
                            }
                        } else {
                            cb({type: 'MESSAGE', message});
                        }
                    }
                } catch (error) {
                    // send back the error
                    cb({type: 'ERROR', error});
                }
            }
            function onErrorHandler(error) {
                cb({type: 'ERROR', error});
            }
            function onCloseHandler() {
                // remove events listeners
                _ws.off('open', onOpenHandler);
                _ws.off('message', onMessageHandler);
                _ws.off('error', onErrorHandler);
                _ws.off('close', onCloseHandler);
                cb({type: 'STATUS_DISCONNECTED', needReconnect: _self._needReconnect});
            }

            // create websocket
            _ws = new WebSocket(eventsUrl, {
                perMessageDeflate: false,
                rejectUnauthorized: _self._ssl,
                headers: {
                    Cookie: cookies
                }
            });

            // associate events handlers with events listeners
            _ws.on('open', onOpenHandler);
            _ws.on('message', onMessageHandler);
            _ws.on('error', onErrorHandler);
            _ws.on('close', onCloseHandler);

            _self._ws = _ws;
        } catch (error) {
            cb({type: 'ERROR', error});
        }
    };

    _self.close = function () {
        if (_self._ws) {
            // graceful close connection without reconnect
            _self._needReconnect = false;
            _self._ws.close(1001);
        }
    };
};

exports.ControllerWS = ControllerWS;