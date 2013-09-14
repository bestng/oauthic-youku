var should = require('should')

var restify = require('restify')

var oauthic = require('../')

//
// prepares test server
//

var server = restify.createServer()

server.use(restify.queryParser())
server.use(restify.bodyParser({ mapParams: false }))

var token_created_at = Math.round(+new Date() / 1000)
  , token_expires_in = 5 * 60

server.post('/protected', function (req, res, next) {
  res.send({ query: req.query, body: req.body })
})

server.get('/protected', function (req, res, next) {
  res.send({ query: req.query, body: req.body })
})

server.post('/oauth2/token', function (req, res, next) {
  if ('correct_client_id' == req.body.client_id
    && 'correct_client_secret' == req.body.client_secret
    && 'authorization_code' == req.body.grant_type
    && 'correct_code' == req.body.code
    && 'correct_redirect_uri' == req.body.redirect_uri) {
    res.send({
      'access_token': 'correct_token'
    , 'token_type': 'Bearer'
    , 'expires_in': token_expires_in
    , 'refresh_token': 'correct_refresh_token'
    })
    return next()
  }
  else if ('correct_client_id' == req.body.client_id
    && 'correct_client_secret' == req.body.client_secret
    && 'refresh_token' == req.body.grant_type
    && 'correct_refresh_token' == req.body.refresh_token) {
    res.send({
      'access_token': 'correct_token'
    , 'token_type': 'Bearer'
    , 'expires_in': token_expires_in
    , 'refresh_token': 'new_refresh_token'
    })
    return next()
  }
  else {
    res.send(400, { 'error': 'bad request' })
    return next()
  }
})

server.post('/users/myinfo.json', function (req, res, next) {
  if ('correct_token' == req.body.access_token
    && 'correct_client_id' == req.body.client_id) {
    res.send({
      "id": "87919223",
      "name": "okingskyo",
      "gender": "m",
      "description": "我勒个去",
      "link": "http://i.youku.com/u/UMzUxNjc2ODky",
      "avatar": "http://static.youku.com/v1.0.0742/user/img/head/64/999.jpg",
      "avatar_large": "http://static.youku.com/v1.0.0742/user/img/head/150/999.jpg",
      "videos_count": "0",
      "playlists_count": "0",
      "favorites_count": "1",
      "followers_count": 0,
      "following_count": 11,
      "statuses_count": 0,
      "regist_time": "2011-05-24 14:20:32",
      "following": false,
      "follower": false
    })
    return next()
  }
  else {
    res.send(403, { 'error': 'unauthorized' })
    return next()
  }
})

describe('oauthic.youku.test.js', function () {

  before(function (done) {
    server.listen(0, function () {
      oauthic.Client.prototype.BASE_URL = 'http://localhost:'
                                        + server.address().port
      done()
    })
  })

  after(function () {
    server.close()
  })

  describe('lib', function () {
    describe('oauthic.client(clientInfo)', function () {

      it('should return new instance of oauthic.Client', function () {
        oauthic.client().should.be.an.instanceof(oauthic.Client)
      })

      it('should pass `clientInfo` to the new instance as a parameter', function () {
        var client = oauthic.client({ this_is: 'a_test_param'})
        should.exists(client)
        client.should.have.property('this_is', 'a_test_param')
      })

      it('should always create a new instance', function () {
        var instanceA = oauthic.client().token('token_a')
          , instanceB = oauthic.client()

        should.exists(instanceA)
        should.exists(instanceB)

        instanceA.accessToken.should.not.equal(instanceB.accessToken)
      })

      describe('client.authorize([options])', function () {

        var client = oauthic.client({
          clientId: 'correct_client_id'
        , redirectUri: 'correct_redirect_uri'
        })

        var parse = require('url').parse

        it('should returns correct authorize url with options', function () {
          var url = client.authorize({
            state: 'test'
          })

          url.should.be.a('string')

          var query = parse(url, true).query

          query.should.have.property('client_id', 'correct_client_id')
          query.should.have.property('response_type', 'code')
          query.should.have.property('redirect_uri', 'correct_redirect_uri')
          query.should.have.property('state', 'test')
        })

        it('should returns correct authorize url without options', function () {
          var url = client.authorize()

          url.should.be.a('string')

          var query = parse(url, true).query

          query.should.have.property('client_id', 'correct_client_id')
          query.should.have.property('response_type', 'code')
          query.should.have.property('redirect_uri', 'correct_redirect_uri')
          query.should.not.have.property('state')
        })

      })

      describe('client.credentical(code, callback)', function () {

        !(function () {
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          , redirectUri: 'correct_redirect_uri'
          })

          it('should callback `credentical` and `userInfo` if success', function (done) {
            client.credentical('correct_code', function (err, credentical, userInfo) {
              should.not.exist(err)

              credentical.should.have.property('accessToken', 'correct_token')
              credentical.should.have.property('expiresAt')
              credentical.should.have.property('refreshToken', 'correct_refresh_token')

              userInfo.should.have.property('id', '87919223')
              userInfo.should.have.property('picture', 'http://static.youku.com/v1.0.0742/user/img/head/64/999.jpg')
              userInfo.should.have.property('name', 'okingskyo')

              done()
            })
          })

          it('should set `client.accessToken` after success', function () {
            client.should.have.property('accessToken', 'correct_token')
          })
        })()

        it('should fails if the api returns an error', function (done) {
          var client = oauthic.client()
          client.credentical('correct_code', function (err, credentical, userInfo) {
            should.exist(err)
            done()
          })
        })

        it('should fails if the request occurs an error', function (done) {
          var client = oauthic.client()
          client.OAUTH2_URL = 'http://localhost:2'
          client.credentical('correct_code', function (err, credentical, userInfo) {
            should.exist(err)
            done()
          })
        })

      })

      describe('client.token(accessToken[, expiresAt])', function () {

        var client = oauthic.client()

        it('should set `client.accessToken`', function () {
          client.token('token_for_test')
          client.should.have.property('accessToken', 'token_for_test')
        })

      })

      describe('client.refresh([refreshToken, ]onRefreshed)', function () {

        it('should be used to refresh when expired', function (done) {
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          })

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (refreshed, next) {
            next()
          })

          client.post('/protected', function (err, res, body) {
            should.not.exist(err)
            body.body.should.have.property('client_id', 'correct_client_id')
            body.body.should.have.property('access_token', 'correct_token')
            done()
          })
        })

        it('should bypass `refreshToken`', function (done) {
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          })

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refreshToken = 'correct_refresh_token'

          client.refresh(function (refreshed, next) {
            next()
          })

          client.post('/protected', function (err, res, body) {
            should.not.exist(err)
            should.exist(body.body)
            body.body.should.have.property('client_id', 'correct_client_id')
            body.body.should.have.property('access_token', 'correct_token')
            done()
          })
        })

        it('should call `onRefreshed` after refreshed and before request', function (done) {
          var i = 1
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          })

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (refreshed, next) {
            refreshed.should.have.property('accessToken', 'correct_token')

            refreshed.expiresAt.should.be.an.instanceof(Date)
            var _expiresAt = +refreshed.expiresAt
            _expiresAt.should.above(token_created_at * 1000)

            i = 2

            next()
          })

          client.post('/protected', function (err, res, body) {
            i.should.equal(2)
            done()
          })
        })

        it('should renew `client.accessToken` and `client.refreshToken` after refreshed', function (done) {
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          })

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (refreshed, next) {
            next()
          })

          client.post('/protected', function (err, res, body) {
            client.should.have.property('accessToken', 'correct_token')
            client.should.have.property('refreshToken', 'new_refresh_token')
            done()
          })
        })

        it('should not renew `client.accessToken` if error', function (done) {
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          })

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (refreshed, next) {
            next('i am an error')
          })

          client.post('/protected', function (err, res, body) {
            client.should.have.property('accessToken', 'expired_token')
            done()
          })
        })

        it('should call `onExpired` when expired and `.refresh` fails', function (done) {
          var client = oauthic.client()

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (refreshed, next) {
            next('i am an error')
          })

          client.expired(function (token) {
            should.exist(token)
            token.should.equal('expired_token')
            done()
          })

          client.post('/protected', function (err, res, body) {})
        })

        it('should not call `onExpired` if refreshed successfully', function (done) {
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          })

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (refreshed, next) {
            next()
          })

          client.expired(function () {
            throw new Error('This callback should not be called')
          })

          client.post('/protected', function (err, res, body) {
            client.should.have.property('accessToken', 'correct_token')
            done()
          })
        })

      })

      describe('client.expired(onExpired)', function () {

        it('should call `onExpired` if expired when request', function (done) {
          var i = 1
          var client = oauthic.client()

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.expired(function () {
            i.should.equal(2)
            done()
          })

          i = 2

          client.post('/protected', function (err, res, body) {})
        })

      })

      describe('client.post(uri[, options][, callback])', function () {

        it('should callbacks `oauthic.TokenExpiredError` if expired', function (done) {
          var client = oauthic.client()
          client.token('expired_token', (token_created_at - 60) * 1000)
          client.post('/protected', function (err, res, body) {
            should.exist(err)
            err.should.have.property('name', 'TokenExpiredError')
            err.should.have.property('token', 'expired_token')
            done()
          })
        })

      })
    })
  })

  describe('oauth2', function () {

    var client = oauthic.client({
      clientId: 'correct_client_id'
    , clientSecret: 'correct_client_secret'
    , redirectUri: 'correct_redirect_uri'
    })

    it('should request without token before authorize', function (done) {
      client.post('/protected', {
        form: { a: 1, b: true }
      }, function (err, res, body) {
        res.should.be.json
        should.not.exist(err)
        should.exist(body.body)
        body.body.should.have.property('a', '1')
        body.body.should.have.property('b', 'true')
        body.body.should.not.have.property('client_id')
        body.body.should.not.have.property('access_token')
        done()
      })
    })

    it('should authorize with code', function (done) {
      client.credentical('correct_code', function (err, credentical, userInfo) {
        should.not.exist(err)
        credentical.accessToken.should.equal('correct_token')
        credentical.expiresAt.should.be.an.instanceof(Date)
        var expiresAt = +credentical.expiresAt
        expiresAt.should.above(token_created_at * 1000)
        done()
      })
    })

    it('should post with token after authorized', function (done) {
      client.post('/protected', function (err, res, body) {
        res.should.be.json
        should.not.exist(err)
        should.exist(body.body)
        body.body.should.have.property('client_id', 'correct_client_id')
        body.body.should.have.property('access_token', 'correct_token')
        done()
      })
    })

    it('should get with token after authorized', function (done) {
      client.get('/protected?a=1', function (err, res, body) {
        res.should.be.json
        should.not.exist(err)
        should.exist(body.query)
        body.query.should.have.property('a', '1')
        body.query.should.have.property('client_id', 'correct_client_id')
        body.query.should.have.property('access_token', 'correct_token')
        done()
      })
    })

  })
})
