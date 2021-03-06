/*
 * Copyright (c) 2015-1016 TechnologyAdvice
 */

'use strict'

const AWS = require('aws-sdk')
const getKey = require('src/keySources/kms')
const nock = require('nock')

const dataKey = 'foo='
const plainKey = 'WJcfREHOMttStwb1927PQwpDJgOgRyVoVMODQxx3pK4='

describe('KMS Source', () => {
  afterEach(() => nock.cleanAll())
  beforeEach(() => {
    AWS.config.update({
      accessKeyId: '1234567890',
      secretAccessKey: '1234567890',
      region: 'us-east-1'
    })
  })
  it('resolves with the provided key', () => {
    const mock = nock('https://kms.us-east-1.amazonaws.com:443')
      .post('/', { CiphertextBlob: dataKey })
      .reply(200, {
        KeyId: 'arn:aws:kms:us-east-1:123456789012:key/' +
          '12345678-1234-4321-1234-123456789012',
        Plaintext: plainKey
      }, {
        server: 'Server',
        date: 'Thu, 22 Oct 2015 02:00:46 GMT',
        'content-type': 'application/x-amz-json-1.1',
        'content-length': '146',
        connection: 'close',
        'x-amzn-requestid': '12345678-1234-1234-1234-123456789012'
      })
    return getKey({ dataKey }).then((key) => {
      should.exist(key)
      key.should.be.instanceOf(Buffer)
      key.length.should.be.greaterThan(0)
      key.toString('base64').should.equal(plainKey)
      mock.done()
    })
  })
  it('allows region to be specified', () => {
    const mock = nock('https://kms.us-west-1.amazonaws.com:443')
      .post('/', { CiphertextBlob: dataKey })
      .reply(200, {
        KeyId: 'arn:aws:kms:us-west-1:123456789012:key/' +
        '12345678-1234-4321-1234-123456789012',
        Plaintext: plainKey
      }, {
        server: 'Server',
        date: 'Thu, 22 Oct 2015 02:00:46 GMT',
        'content-type': 'application/x-amz-json-1.1',
        'content-length': '146',
        connection: 'close',
        'x-amzn-requestid': '12345678-1234-1234-1234-123456789012'
      })
    return getKey({ dataKey, region: 'us-west-1' }).then((key) => {
      should.exist(key)
      mock.done()
    })
  })
  it('rejects on bad HTTP response', () => {
    nock('https://kms.us-east-1.amazonaws.com:443')
      .post('/', { CiphertextBlob: dataKey })
      .reply(503)
    return getKey({ dataKey }).should.be.rejected
  })
  it('rejects when option "dataKey" is missing', () => {
    return getKey().should.be.rejected
  })
})
