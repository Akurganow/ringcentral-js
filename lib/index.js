/// <reference path="../typings/tsd.d.ts" />
var promise = require('es6-promise');
var pubnub = require('pubnub');
var rcsdk = require('./RCSDK');
require('crypto-js/aes');
require('crypto-js/mode-ecb');
var CryptoJS = require('crypto-js/core');
var XHR = (typeof (XMLHttpRequest) !== 'undefined' ? XMLHttpRequest : function () {
    try {
        return new ActiveXObject("Msxml2.XMLHTTP.6.0");
    }
    catch (e1) {
    }
    try {
        return new ActiveXObject("Msxml2.XMLHTTP.3.0");
    }
    catch (e2) {
    }
    try {
        return new ActiveXObject("Msxml2.XMLHTTP");
    }
    catch (e3) {
    }
    try {
        return require('xhr2');
    }
    catch (e3) {
    }
    throw new Error("This browser does not support XMLHttpRequest.");
});
exports = module.exports = rcsdk.factory({
    CryptoJS: CryptoJS,
    localStorage: typeof (localStorage) !== 'undefined' ? localStorage : require('dom-storage'),
    Promise: typeof (Promise) !== 'undefined' ? Promise : promise.Promise,
    PUBNUB: pubnub,
    XHR: XHR
});
