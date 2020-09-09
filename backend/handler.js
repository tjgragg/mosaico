/* global Promise: false */
var fs = require('fs');
var axios = require('axios').default;

module.exports = function(req, res) {
  console.log('hello!');
  /*

  var instance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });

  req.headers.appId = '2';
  req.headers.appAuthKey = 'giphy';

  // console.log('headers? ', req.headers);
  // console.log('body? ', req.body);
  // console.log('req.method: ', req.method);
  // console.log('req headers "? \n ', req.headers);
  // console.log('\n\n\n');
  // console.log(req.inputStream);
  // console.log('\n\n\n');
  // res.status = 200;
  instance.post('https://localhost:9443/s3', req)
    .then(function(res) {
      console.log('res?', res);
      return res.send('hello world');
  }).catch(function(e) {
    console.log('excetpion', e);
    return res.send('goodbye cruel world');
  });

     */
};