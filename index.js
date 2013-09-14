var oauthic = require('oauthic')
  , request = oauthic._request

var async = require('async')
  , inherits = require('util').inherits
  , qs = require('querystring')
  , ur = require('url')

exports.client = exports.Client = Client
exports.TokenExpiredError = oauthic.TokenExpiredError
exports.EndpointError = oauthic.EndpointError

function Client (clientInfo) {
  if (!(this instanceof Client)) {
    return new Client(clientInfo)
  }

  oauthic.Client.apply(this, arguments)
}

inherits(Client, oauthic.Client)

Client.prototype.BASE_URL = 'https://openapi.youku.com/v2'

Client.prototype._authorize = function (options) {
  options = options || {}

  var query = {}

  query['client_id'] = this.clientId
  query['response_type'] = 'code'
  query['redirect_uri'] = this.redirectUri

  if (options.state) {
    query['state'] = String(options.state)
  }

  return this.BASE_URL + '/oauth2/authorize?' + qs.stringify(query)
}

Client.prototype._credentical = function (code, callback) {
  var self = this

  async.waterfall([
    function (next) {
      request.post(self.BASE_URL + '/oauth2/token', {
        form: {
          'client_id': self.clientId
        , 'client_secret': self.clientSecret
        , 'grant_type': 'authorization_code'
        , 'code': code
        , 'redirect_uri': self.redirectUri
        }
      , json: true
      }, function (err, res, json) {
        if (err) {
          return next(err)
        }

        if (json.error) {
          return next(new oauthic.EndpointError(json))
        }

        var credentical = {
          accessToken: json.access_token
        , refreshToken: json.refresh_token
        , expiresAt: new Date(+new Date() + json.expires_in * 1000)
        }

        return next(null, credentical)
      })
    }
  , function (credentical, next) {
      request.post(self.BASE_URL + '/users/myinfo.json', {
        form: {
          'client_id': self.clientId
        , 'access_token': credentical.accessToken
        }
      , json: true
      }, function (err, res, json) {
        if (err) {
          return next(err)
        }

        if (json.error) {
          return next(new oauthic.EndpointError(json))
        }

        var userInfo = {
          id: json.id
        , picture: json.avatar
        , name: json.name
        , _json: json
        }

        return next(null, credentical, userInfo)
      })
    }
  ], callback)
}

Client.prototype._refresh = function (refreshToken, callback) {
  request.post(this.BASE_URL + '/oauth2/token', {
    form: {
      'client_id': this.clientId
    , 'client_secret': this.clientSecret
    , 'grant_type': 'refresh_token'
    , 'refresh_token': refreshToken
    }
  , json: true
  }, function (err, res, json) {
    if (err) {
      return callback(err)
    }

    if (json.error) {
      return callback(new oauthic.EndpointError(json))
    }

    callback(null, {
      accessToken: json.access_token
    , expiresAt: new Date(+new Date() + json.expires_in * 1000)
    , refreshToken: json.refresh_token  // refresh_token changes once refreshed
    })
  })
}

Client.prototype._use = function (uri, options, method) {
  if (this.clientId && this.accessToken) {
    if ('get' == method) {
      var url = ur.parse(uri, true)

      delete url.path
      delete url.href
      delete url.search

      url.query['client_id'] = this.clientId
      url.query['access_token'] = this.accessToken

      uri = ur.format(url)
    }
    else {
      options.form = options.form || {}
      options.form['client_id'] = this.clientId
      options.form['access_token'] = this.accessToken
    }
  }

  if ('undefined' === typeof options.json) {
    options.json = true
  }

  return uri
}

exports.TokenExpiredError = oauthic.TokenExpiredError
