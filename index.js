var EnvBang = new require('envbang-node');
var envbang = new EnvBang(['TOGGL_API_TOKEN']);
envbang.check();

var request = require('request');
var qs = require('querystring');
var moment = require('moment');
var _ = require('underscore');

var toggl = {
  _url: 'https://www.toggl.com/api/v8',
  get: function(pth, next){
    request
      .get(this._url+pth, function(err,res, body){
        if(err){
          return next(err);
        }
        next(null, JSON.parse(body));
      })
      .auth(process.env.TOGGL_API_TOKEN, 'api_token', true);
  }
};

var day = moment();
var url = '/time_entries?'+
  qs.stringify({
    start_date:day.startOf('day').toISOString(),
    end_date:day.endOf('day').toISOString() });

module.exports = function(cb) {
  toggl.get(url, function(err, data){
    if(err){
      return cb(err);
    }

    var current = false;
    cb(null, _.chain(data)
      .groupBy('wid')
      .mapObject(function(tasks){
        return _.chain(tasks)
          .map(function(itm){
            if(itm.duration < 0){
              var t = Math.floor((new Date() / 1000) + itm.duration);
              itm.stop = moment().format();
              itm.duration = t;
              current = itm;
            }
            return itm;
          })
          .map(function(itm) {
            return _.pick(itm, 'duration', 'description');
          })
          .groupBy('description')
          .mapObject(function(gr) {
            return _.reduce(gr, function(acc, itm){
              return acc + itm.duration;
            }, 0);
          })
          .map(function(dur, key) {
            var h = Math.floor(dur / 3600);
            var m = Math.floor((dur - h*3600) / 60);
            var human = h+':'+(m<10 ? '0'+m : m);
            return {
              active: current && current.description === key,
              duration: dur,
              human: human, 
              description: key
            };
          })
          .value();
      })

      .value()
    );
  });
};
