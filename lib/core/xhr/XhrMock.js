/**
 * istanbul ignore next
 * @description RingPlatform JS SDK
 * @copyright © 2014-2015 RingCentral, Inc. All rights reserved.
 */
define(function(require, exports, module) {

    'use strict';

    var Log = require('../Log'),
        Utils = require('../Utils');

    /**
     * @constructor
     * @alias RCSDK.core.ajax.XhrMock
     * @extends XMLHttpRequest
     */
    function XhrMock(context) {
        // Service
        this.responses = require('./XhrResponse').$get(context);
        // Request
        this.async = true;
        this.method = '';
        this.url = '';
        this.requestHeaders = {};
        this.withCredentials = false;
        // Response
        this.data = null;
        this.readyState = 0;
        this.responseHeaders = {};
        this.status = 0;
        this.context = context;
    }

    XhrMock.prototype.getResponseHeader = function(header) {
        return this.responseHeaders[header.toLowerCase()];
    };

    XhrMock.prototype.setRequestHeader = function(header, value) {
        this.requestHeaders[header.toLowerCase()] = value;
    };

    XhrMock.prototype.open = function(method, url, async) {
        this.method = method;
        this.url = url;
        this.async = async;
    };

    XhrMock.prototype.send = function(data) {

        var contentType = this.getRequestHeader('Content-Type');

        this.data = data;

        if (this.data && typeof this.data == 'string') {
            // For convenience encoded post data will be decoded
            if (contentType == 'application/json') this.data = JSON.parse(this.data);
            if (contentType == 'application/x-www-form-urlencoded') this.data = Utils.parseQueryString(this.data);
        }

        Log.debug('API REQUEST', this.method, this.url);

        var currentResponse = this.responses.find(this);

        if (!currentResponse) {
            setTimeout(function() {
                this.onerror && this.onerror(new Error('Unknown request: ' + this.url));
            }.bind(this), 1);
            return;
        }

        this.setStatus(200);
        this.setResponseHeader('Content-Type', 'application/json');

        var res = currentResponse.response(this),
            Promise = this.context.getPromise();

        function onLoad(res) {

            if (this.getResponseHeader('Content-Type') == 'application/json') res = JSON.stringify(res);

            this.responseText = res;

            setTimeout(function() {
                this.onload && this.onload();
            }.bind(this), 1);

        }

        if (res instanceof Promise) {

            res.then(onLoad.bind(this)).catch(this.onerror.bind(this));

        } else onLoad.call(this, res);

    };

    XhrMock.prototype.abort = function() {
        Log.debug('XhrMock.destroy(): Aborted');
    };

    XhrMock.prototype.getRequestHeader = function(header) {
        return this.requestHeaders[header.toLowerCase()];
    };

    XhrMock.prototype.setResponseHeader = function(header, value) {
        this.responseHeaders[header.toLowerCase()] = value;
    };

    XhrMock.prototype.setStatus = function(status) {
        this.status = status;
        return this;
    };

    module.exports = {
        Class: XhrMock,
        /**
         * @static
         * @param {Context} context
         * @returns {XhrMock}
         */
        $get: function(context) {

            return new XhrMock(context);

        }
    };

});
