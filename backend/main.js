"use strict";
/* global module: false, console: false, __dirname: false, process: false */

var express = require('express');
var axios = require('axios').default;
var bodyParser = require('body-parser');
var gmagic = require('gm');

var gm = gmagic.subClass({imageMagick: true});
var https = require('https');
var url = require('url');

var app = express();

app.use(require('connect-livereload')({ ignore: [/^\/dl/, /^\/img/] }));

app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  limit: '5mb',
  extended: true
}));

function getImages(callback) {
  axios.request({
    baseURL: 'https://localhost:9443',
    data: {
      q: '',
    },
    headers: {appId: 2, appAuthKey: 'giphy'},
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    method: 'POST',
    url: 's3/images/thumbnails/search',
  }).then(function(res) {
    var images = res.data.map(function(image) {
      return {
        name: image.name,
        size: undefined,
        thumbnailUrl: image.thumbnailUrl,
        url: image.fullSizeUrl,
      };
    });
    callback(images);
  }).catch(function(e) {
    console.log('list files e ', e);
  });
}

app.get('/images', function(req, res) {
  // getting all the images.
  getImages(function (images) {
    res.json({ files: images });
  });
});

// imgProcessorBackend + "?src=" + encodeURIComponent(src) + "&method=" + encodeURIComponent(method) + "&params=" + encodeURIComponent(width + "," + height);
app.get('/img/', function(req, res) {
  var params = req.query.params.split(',');

  if (req.query.method == 'placeholder') {
    var out = gm(params[0], params[1], '#808080');
    res.set('Content-Type', 'image/png');
    var x = 0, y = 0;
    var size = 40;
    // stripes
    while (y < params[1]) {
      out = out
        .fill('#707070')
        .drawPolygon([x, y], [x + size, y], [x + size*2, y + size], [x + size*2, y + size*2])
        .drawPolygon([x, y + size], [x + size, y + size*2], [x, y + size*2]);
      x = x + size*2;
      if (x > params[0]) { x = 0; y = y + size*2; }
    }
    // text
    out.fill('#B0B0B0').fontSize(20).drawText(0, 0, params[0] + ' x ' + params[1], 'center').stream('png').pipe(res);

  } else if (req.query.method == 'resize' || req.query.method == 'cover') {
    // NOTE: req.query.src is an URL but gm is ok with URLS.
    // We do parse it to localpath to avoid strict "securityPolicy" found in some ImageMagick install to prevent the manipulation
    var urlparsed = url.parse(req.query.src);
    var src = "./"+decodeURI(urlparsed.pathname);

    var ir = gm(src);
    ir.format(function(err,format) {
      if (!err) {
        res.set('Content-Type', 'image/'+format.toLowerCase());
        if (req.query.method == 'resize') {
          ir.autoOrient().resize(params[0] == 'null' ? null : params[0], params[1] == 'null' ? null : params[1]).stream().pipe(res);
        } else {
          ir.autoOrient().resize(params[0],params[1]+'^').gravity('Center').extent(params[0], params[1]+'>').stream().pipe(res);
        }
      } else {
        console.error("ImageMagick failed to detect image format for", src, ". Error:", err);
        res.status(404).send('Error: '+err);
      }
    });
  }
});

app.post('/dl/', function(req, res) {
  var response = function(source) {

    if (req.body.action == 'download') {
      res.setHeader('Content-disposition', 'attachment; filename=' + req.body.filename);
      res.setHeader('Content-type', 'text/html');
      res.write(source);
      res.end();
    }
  };

  response(req.body.html);
});

// This is needed with grunt-express-server (while it was not needed with grunt-express)
var PORT = process.env.PORT || 3000;

app.use('/templates', express.static(__dirname + '/../templates'));
app.use(express.static(__dirname + '/../dist/'));

app.listen( PORT, function() {
  var check = gm(100, 100, '#000000');
  check.format(function (err, format) {
    if (err) console.error("ImageMagick failed to run self-check image format detection. Error:", err);
  });
  console.log('Express server listening on port ' + PORT);
} );
