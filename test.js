var ts = require('./index.js');
ts.byDesc(['solo', 'соло'],
          process.env.TOGGL_DEFAULT_WID,
          function(err,data) {
            console.log(data);
          });
