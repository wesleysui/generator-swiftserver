var nock = require('nock')
var path = require('path')

exports.mockClientSDKNetworkRequest = function (applicationName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${applicationName}_iOS_SDK/ios_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FINISHED' })
           .get('/sdkgen/api/generator/myid')
           .replyWithFile(
             200,
             path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
             { 'Content-Type': 'application/zip' }
           )
}

exports.mockClientSDKDownloadFailure = function (applicationName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${applicationName}_iOS_SDK/ios_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FINISHED' })
           .get('/sdkgen/api/generator/myid')
           .replyWithError({ message: 'getaddrinfo ENOTFOUND', code: 'ENOTFOUND' })
}

exports.mockClientSDKGenerationFailure = function (applicationName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${applicationName}_iOS_SDK/ios_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FAILED' })
}

exports.mockClientSDKGenerationTimeout = function (applicationName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${applicationName}_iOS_SDK/ios_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .times(11)
           .reply(200, { status: 'VALIDATING' })
}

exports.mockServerSDKNetworkRequest = function (sdkName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${sdkName}_ServerSDK/server_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FINISHED' })
           .get('/sdkgen/api/generator/myid')
           .replyWithFile(
             200,
             path.join(__dirname, '../resources/dummy_ServerSDK.zip'),
             { 'Content-Type': 'application/zip' }
           )
}

exports.mockServerSDKDownloadFailure = function (sdkName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${sdkName}_ServerSDK/server_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FINISHED' })
           .get('/sdkgen/api/generator/myid')
           .replyWithError({ message: 'getaddrinfo ENOTFOUND', code: 'ENOTFOUND' })
}
