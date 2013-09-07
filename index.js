var oauthic = require('oauthic')
  , request = oauthic._request

var async = require('async')
  , inherits = require('util').inherits
  , qs = require('querystring')
  , ur = require('url')

exports.client = function (clientInfo) {
  return new Client(clientInfo)
}

function Client (clientInfo) {
  oauthic.Client.apply(this, arguments)
}

inherits(Client, oauthic.Client)
exports.Client = Client

Client.prototype.BASE_URL = 'https://openapi.youku.com/v2'

var _get = Client.prototype.get
Client.prototype.get = function (uri, options, callback) {
  if ('function' === typeof options) {
    callback = options
    options = {}
  }

  options = options || {}

  if ('undefined' === typeof options.json) {
    options.json = true
  }

  if (this.accessToken
    && (this.clientInfo && this.clientInfo.clientId)) {
    var url = ur.parse(uri, true)
    url.query['client_id'] = this.clientInfo.clientId
    url.query['access_token'] = this.accessToken
    uri = ur.format(url)
  }

  return _get.call(this, uri, options, callback)
}

var _post = Client.prototype.post
Client.prototype.post = function (uri, options, callback) {
  if ('function' === typeof options) {
    callback = options
    options = {}
  }

  options = options || {}

  if ('undefined' === typeof options.json) {
    options.json = true
  }

  if (this.accessToken
    && (this.clientInfo && this.clientInfo.clientId)) {
    if (!options.form) {
      options.form = {}
    }

    options.form['client_id'] = this.clientInfo.clientId
    options.form['access_token'] = this.accessToken
  }

  return _post.call(this, uri, options, callback)
}

Client.prototype._authorize = function (options) {
  this.clientInfo = this.clientInfo || {}
  options = options || {}

  var query = {}

  query['client_id'] = this.clientInfo.clientId
  query['response_type'] = 'code'
  query['redirect_uri'] = this.clientInfo.redirectUri

  if (options.state) {
    query['state'] = String(options.state)
  }

  return this.BASE_URL + '/oauth2/authorize?' + qs.stringify(query)
}

Client.prototype._credentical = function (code, callback) {
  var self = this

  self.clientInfo = self.clientInfo || {}

  async.waterfall([
    function (next) {
      request.post(self.BASE_URL + '/oauth2/token', {
        form: {
          'client_id': self.clientInfo.clientId
        , 'client_secret': self.clientInfo.clientSecret
        , 'grant_type': 'authorization_code'
        , 'code': code
        , 'redirect_uri': self.clientInfo.redirectUri
        }
      , json: true
      }, function (err, res, json) {
        if (err) {
          return next(err)
        }

        if (json.error) {
          return next(json)
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
          'client_id': self.clientInfo.clientId
        , 'access_token': credentical.accessToken
        }
      , json: true
      }, function (err, res, json) {
        if (err) {
          return next(err)
        }

        if (json.error) {
          return next(json)
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
  this.clientInfo = this.clientInfo || {}

  request.post(this.BASE_URL + '/oauth2/token', {
    form: {
      'client_id': this.clientInfo.clientId
    , 'client_secret': this.clientInfo.clientSecret
    , 'grant_type': 'refresh_token'
    , 'refresh_token': refreshToken
    }
  , json: true
  }, function (err, res, json) {
    if (err) {
      return callback(err)
    }

    callback(null, {
      accessToken: json.access_token
    , expiresAt: new Date(+new Date() + json.expires_in * 1000)
    , refreshToken: json.refresh_token  // refresh_token changes once refreshed
    })
  })
}

Client.prototype._use = function (options) {
  // this hook would be deprecated in the feature
  return options
}

exports.TokenExpiredError = oauthic.TokenExpiredError
