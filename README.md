![OAuthic for Youku](https://github.com/bestng/oauthic-youku/raw/master/logo.png)

[![Build Status](https://travis-ci.org/bestng/oauthic-youku.png?branch=master)](https://travis-ci.org/bestng/oauthic-youku)
[![Coverage Status](https://coveralls.io/repos/bestng/oauthic-youku/badge.png)](https://coveralls.io/r/bestng/oauthic-youku)
[![Dependency Status](https://david-dm.org/bestng/oauthic-youku.png)](https://david-dm.org/bestng/oauthic-youku)
[![NPM version](https://badge.fury.io/js/oauthic-youku.png)](http://badge.fury.io/js/oauthic-youku)

Yet another beautiful wrapped [mikeal/request](https://github.com/mikeal/request) with OAuth 2.0 feature for [Youku](http://open.youku.com/).

## Install

```sh
npm install oauthic-youku
```

## Quick-start

#### Authorize

```js
require('oauthic-youku').client({
    clientId: 'q298ajhzxkkp019cjzkoq01'
  , clientSecret: '228bnzokjpasiodufc'
  , redirectUri: 'https://my.server.com/callback'
  })
  .credentical(code, function (err, credentical, userInfo) {
    // ...
  })
```

#### Request

```js
var client = require('oauthic-youku').client({
    clientId: 'q298ajhzxkkp019cjzkoq01'
  , clientSecret: '228bnzokjpasiodufc'
  })
  .token(accessToken, expiresAt)
  .refresh(refreshToken, function (token, expiresAt, next) {
    // saveToDb(token)
    return next()
  })
  .expired(function (token) {
    // log(token + ' has expired and could not be refreshed.')
  })

client.get('/mirror/v1/timeline', function (err, res, timeline) {
  // ...
})
```

## oauthic.client(clientInfo)

Create a new client instance.

#### Arguments

- **clientInfo** Object - Client informations
    - **clientId** String - App Key
    - **clientScrect** String - App Secret
    - **redirectUri** String - URL to be redirected to by the provider.

#### Returns

- oauthic.Client - Client instance

## Class: oauthic.Client

Client, a wrapped [mikeal/request](https://github.com/mikeal/request) instance.

### client.authorize([options])

Build the URL of the authorization page.

#### Arguments

- **options** - Additional parameters
    - ***scope*** String | Array - Additional scopes. Should be an array or a string separated by a space. Defaults to `openid profile`
    - ***state*** String - A parameter that would be in the query string in `redirectUri`. It's useful in avoiding CSRF attacking
    - ***prompt*** String - A space-delimited list of string values that specifies whether to prompts the user for re-authentication and consent. Possible values (see [youku's OAuth 2.0 docs](https://developers.youku.com/accounts/docs/OAuth2Login#authenticationuriparameters) for more):
        - `none` - do not display any authentication or consent pages
        - `consent` - prompt the user for consent
        - `select_account` - prompt the user to select a user account
    - ***display*** String - Specifies how to display the authentication page. Possible values: `page`, `popup`, `touch` or `wap`
    - ***loginHint*** - Provides the user's unique ID or email if it's known to skip the multi-login selecting page or pre-fill the email box on the sign-in form
    - ***accessType*** - Either `online` (default value) or `offline`. Should be `offline` if you want a Refresh Token
    - ***approvalPrompt*** - Should be `force` if you want a Refresh Token

#### Returns

- String - URL of the authorization page

### client.credentical(code, callback)

Get Access Token with an Authorization Code and get ready for making a request.

#### Arguments

- **code** String - Authorization Code
- **callback(err, credentical, userInfo)** Function - Callback
    - **err** Error | null - Error object
    - **credentical** Object - Token informations
        - **accessToken** String - Access Token
        - **expiresAt** Date - The time when Access Token expires
        - ***refreshToken*** String - Refresh Token
    - **userInfo** Object - Additional user informations
        - **id** String - The user's unique ID
        - ***picture*** String - The URL of user's avatar picture (requires `profile` scope)
        - ***name*** String - The user's display name (requires `profile` scope)
        - ***gender*** String - The user's gender (requires `profile` scope)
        - ***locale*** String - The user's language (requires `profile` scope)
        - ***email*** String The user's email address (requires `email` scope)
        - ***_json*** - Object - Original JSON responsed

#### Returns

- oauthic.Client - Client instance

### client.token(accessToken[, expiresAt])

Set the Access Token.

#### Arguments

- **accessToken** String - Access Token
- ***expiresAt*** Date | Number - Optional. The time when Access Token expires

#### Returns

- oauthic.Client - Client instance

### client.refresh([refreshToken, ]onRefreshed)

Sets the Refresh Token and/or a handler that would be called when the Access Token is refreshed by the Refresh Token.

#### Arguments

- ***refreshToken*** String - Refresh Token
- **onRefreshed(token, expiresAt, done)** Function - A handler that would be called when the Access Token is refreshed successfully by the Refresh Token. It's useful because you may want to save the new Access Token to the database
    - **token** String - The new Access Token
    - **expiresAt** Date - The time when the new Access Token expires
    - **done([err])** Function - A callback that must be called to continue the flow after you have finished dealing with the new Token
        - ***err*** Error - Would be an error object

#### Returns

- oauthic.Client - Client instance

### client.expired(onExpired)

Registers a handler that would be called when the Access Token is expired and could not be refreshed.

#### Arguments

- **onExpired(token)** Function - Handler function
    - **token** String - The expired Access Token

### client.get(uri[, options][, callback]), client.post(uri[, options][, callback])

Wrapped methods from [mikeal/request](https://github.com/mikeal/request). General parameters (e.g. access token) is added. URL could be written in short form, e.g. `/mirror/v1/timeline` for `https://www.youkuapi.com/mirror/v1/timeline`.

#### Errors

- oauthic.TokenExpiredError - The Access Token is expired and could not be refreshed

### client.accessToken

- String

Returns the current user's Access Token. Useful when you'd prefer building request parameters manually.

## oauthic.TokenExpiredError

Occurs when the Access Token is expired and could not be refreshed.

#### Properties

- **token** String - The expired Access Token

## License

(The MIT License)

Copyright (c) 2013 XiNGRZ &lt;chenxingyu92@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
