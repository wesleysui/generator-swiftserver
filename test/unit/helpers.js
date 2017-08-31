/*
 * Copyright IBM Corporation 2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'
var assert = require('assert')
var helpers = require('../../lib/helpers')
var nock = require('nock')
var path = require('path')
var memFs = require('mem-fs')
var editor = require('mem-fs-editor')

describe('helpers', function () {
  describe('generateServiceName', function () {
    var serviceName

    before(function () {
      serviceName = helpers.generateServiceName('app', 'service')
    })

    it('created a name string', function () {
      assert.equal(typeof (serviceName), 'string')
    })

    it('created a name prefixed with appName and serviceType', function () {
      assert(serviceName.startsWith('app-service-'))
    })

    it('created a name with a random 4 character suffix', function () {
      var suffix = serviceName.substring('app-service-'.length)
      assert.equal(suffix.length, 4)
      assert(suffix.match(/[a-z]\d[a-z]\d/))
    })
  })

  describe('sanitizeAppName', function () {
    it('alpha name unchanged', function () {
      assert.equal(helpers.sanitizeAppName('bob'), 'bob')
    })

    it('alphanumeric name unchanged', function () {
      assert.equal(helpers.sanitizeAppName('b33ob4'), 'b33ob4')
    })

    it('numbers stripped from start', function () {
      assert.equal(helpers.sanitizeAppName('33b33ob4'), 'b33ob4')
      assert.equal(helpers.sanitizeAppName('^33b33ob4'), 'b33ob4')
    })

    it('non-alphanumerics stripped from everywhere', function () {
      assert.equal(helpers.sanitizeAppName('*(&33b@33ob4'), 'b33ob4')
      assert.equal(helpers.sanitizeAppName('3*(&3 3b@33ob4'), 'b33ob4')
      assert.equal(helpers.sanitizeAppName('h3*(&33b@33ob4'), 'h333b33ob4')
      assert.equal(helpers.sanitizeAppName(' h3*(&33b@33ob4'), 'h333b33ob4')
    })

    it('empty or completely invalid string gives generic name', function () {
      assert.equal(helpers.sanitizeAppName(''), 'SWIFTSERVERAPP')
      assert.equal(helpers.sanitizeAppName(' '), 'SWIFTSERVERAPP')
      assert.equal(helpers.sanitizeAppName('*(&@'), 'SWIFTSERVERAPP')
      assert.equal(helpers.sanitizeAppName('*(&33@334'), 'SWIFTSERVERAPP')
    })
  })

  describe('getBluemixServiceLabel', function () {
    it('get label for cloudant', function () {
      assert.equal(helpers.getBluemixServiceLabel('cloudant'), 'cloudantNoSQLDB')
    })

    it('get label for redis', function () {
      assert.equal(helpers.getBluemixServiceLabel('redis'), 'compose-for-redis')
    })

    it('get label for objectstorage', function () {
      assert.equal(helpers.getBluemixServiceLabel('objectstorage'), 'Object-Storage')
    })

    it('get label for appid', function () {
      assert.equal(helpers.getBluemixServiceLabel('appid'), 'AppID')
    })

    it('get label for watsonconversation', function () {
      assert.equal(helpers.getBluemixServiceLabel('watsonconversation'), 'conversation')
    })

    it('get label for alertnotification', function () {
      assert.equal(helpers.getBluemixServiceLabel('alertnotification'), 'AlertNotification')
    })

    it('get label for pushnotifications', function () {
      assert.equal(helpers.getBluemixServiceLabel('pushnotifications'), 'imfpush')
    })

    it('get label for unrecognised value', function () {
      assert.equal(helpers.getBluemixServiceLabel('unrecognised'), 'unrecognised')
    })
  })

  describe('getBluemixDefaultPlan', function () {
    it('get default plan for cloudant', function () {
      assert.equal(helpers.getBluemixDefaultPlan('cloudant'), 'Lite')
    })

    it('get default plan for redis', function () {
      assert.equal(helpers.getBluemixDefaultPlan('redis'), 'Standard')
    })

    it('get default plan for objectstorage', function () {
      assert.equal(helpers.getBluemixDefaultPlan('objectstorage'), 'Free')
    })

    it('get default plan for appid', function () {
      assert.equal(helpers.getBluemixDefaultPlan('appid'), 'Graduated tier')
    })

    it('get default plan for watsonconversation', function () {
      assert.equal(helpers.getBluemixDefaultPlan('watsonconversation'), 'Free')
    })

    it('get default plan for alertnotification', function () {
      assert.equal(helpers.getBluemixDefaultPlan('alertnotification'), 'Authorized Users')
    })

    it('get default plan for pushnotifications', function () {
      assert.equal(helpers.getBluemixDefaultPlan('pushnotifications'), 'Lite')
    })

    it('get default plan for unrecognised value', function () {
      assert.equal(helpers.getBluemixDefaultPlan('unrecognised'), 'Lite')
    })
  })

  describe('convertDefaultValue', function () {
    it('convert string', function () {
      assert.equal(helpers.convertDefaultValue('string', 'cloudant'), 'cloudant')
    })

    it('convert number', function () {
      assert.equal(helpers.convertDefaultValue('number', '3.14159'), 3.14159)
    })

    it('convert boolean', function () {
      assert.equal(helpers.convertDefaultValue('boolean', 'true'), true)
    })

    it('convert object', function () {
      assert.objectContent(helpers.convertDefaultValue('object', '{"value":"a value"}'), {value: 'a value'})
    })

    it('convert array', function () {
      assert.objectContent(helpers.convertDefaultValue('array', '[3.14159, 122]'), [3.14159, 122])
    })

    it('convert unrecognised type', function () {
      try {
        var result = helpers.convertDefaultValue('pi', '3.14159')
        assert.fail(typeof (result), '[string, number, boolean, object]', false, 'type not one of')
      } catch (err) {
        assert.equal(err.message, "Unrecognised type 'pi'")
      }
    })
  })

  describe('convertJSDefaultValueToSwift', function () {
    it('convert string', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift('cloudant'), '"cloudant"')
    })

    it('convert number', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift(3.14159), '3.14159')
    })

    it('convert boolean', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift(true), 'true')
    })

    it('convert object', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift({'value': 'a value'}), '["value": "a value"]')
    })

    it('convert array', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift([3.14159, 122]), '[3.14159, 122]')
    })

    it('convert unrecognised type', function () {
      try {
        var person
        var result = helpers.convertJSDefaultValueToSwift(person)
        assert.fail(typeof (result), '[string, number, boolean, object]', false, 'type not one of')
      } catch (err) {
        assert.equal(err.message, "Unrecognised type 'undefined'")
      }
    })
  })

  describe('convertJSTypeValueToSwift', function () {
    it('convert string', function () {
      assert.equal(helpers.convertJSTypeToSwift('string', false), 'String')
      assert.equal(helpers.convertJSTypeToSwift('string', true), 'String?')
    })

    it('convert number', function () {
      assert.equal(helpers.convertJSTypeToSwift('number', false), 'Double')
      assert.equal(helpers.convertJSTypeToSwift('number', true), 'Double?')
    })

    it('convert boolean', function () {
      assert.equal(helpers.convertJSTypeToSwift('boolean', false), 'Bool')
      assert.equal(helpers.convertJSTypeToSwift('boolean', true), 'Bool?')
    })

    it('convert object', function () {
      assert.equal(helpers.convertJSTypeToSwift('object', false), 'Any')
      assert.equal(helpers.convertJSTypeToSwift('object', true), 'Any?')
    })

    it('convert array', function () {
      assert.equal(helpers.convertJSTypeToSwift('array', false), '[Any]')
      assert.equal(helpers.convertJSTypeToSwift('array', true), '[Any]?')
    })

    it('convert unrecognised type', function () {
      try {
        var person
        var result = helpers.convertJSTypeToSwift(person)
        assert.fail(typeof (result), '[string, number, boolean, object]', false, 'type not one of')
      } catch (err) {
        assert.equal(err.message, "Unrecognised type 'undefined'")
      }
    })
  })

  describe('loadAsync', function () {
    before(function () {
      nock('http://petstore.org')
        .get('/yaml')
        .replyWithFile(200, path.join(__dirname, '../resources/petstore2.yaml'))
    })

    after(function () {
      nock.cleanAll()
    })

    it('load yaml from http', function () {
      helpers.loadAsync('http://petstore.org/yaml')
        .catch(err => {
          assert.fail('failed to load .yaml file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    before(function () {
      nock('http://petstore.org')
        .get('/yml')
        .replyWithFile(200, path.join(__dirname, '../resources/petstore2.yml'))
    })

    after(function () {
      nock.cleanAll()
    })

    it('load yml from http', function () {
      helpers.loadAsync('http://petstore.org/yml')
        .catch(err => {
          assert.fail('failed to load .yml file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    before(function () {
      nock('http://dino.io')
        .get('/json')
        .replyWithFile(200, path.join(__dirname, '../resources/person_dino.json'))
    })

    after(function () {
      nock.cleanAll()
    })

    it('load json from http', function () {
      helpers.loadAsync('http://dino.io/json')
        .catch(err => {
          assert.fail('failed to load .json file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    var store
    var fs

    before(function () {
      store = memFs.create()
      fs = editor.create(store)
    })

    it('load json from file', function () {
      helpers.loadAsync(path.join(__dirname, '../resources/person_dino.json'), fs)
        .catch(err => {
          assert.fail('failed to load .json file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    var store
    var fs

    before(function () {
      store = memFs.create()
      fs = editor.create(store)
    })

    it('load yaml from file', function () {
      helpers.loadAsync(path.join(__dirname, '../resources/petstore2.yaml'), fs)
        .catch(err => {
          assert.fail('failed to load .yaml file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    var store
    var fs

    before(function () {
      store = memFs.create()
      fs = editor.create(store)
    })

    it('load yml from file', function () {
      helpers.loadAsync(path.join(__dirname, '../resources/petstore2.yml'), fs)
        .catch(err => {
          assert.fail('failed to load .yml file:', err)
        })
    })
  })
})
