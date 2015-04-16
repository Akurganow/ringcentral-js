var define = typeof define === 'function' && define.amd ? define : function (factory) {
    factory(require, exports, module);
};
define(function (require, exports, module) {
    exports.mocha = require('../../test/mocha');
    var expect = exports.mocha.chai.expect;
    var spy = exports.mocha.sinon.spy;
    var mock = exports.mocha.mock;
    var rcsdk = exports.mocha.rcsdk;
    describe('RCSDK.helpers.dictionaries.Country', function () {
        'use strict';
        var Country = rcsdk.getCountryHelper();
        describe('createUrl', function () {
            it('returns URL depending on options', function () {
                expect(Country.createUrl()).to.equal('/dictionary/country');
            });
        });
    });
});