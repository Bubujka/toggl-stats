var EnvBang = new require('envbang-node');
var envbang = new EnvBang(['TOGGL_API_TOKEN']);
envbang.check();

var request = require('request');
var qs = require('querystring');
var moment = require('moment');
var _ = require('underscore');
var async = require('async');



var toggl = {
  _url: 'https://www.toggl.com/api/v8',
  _reports_url: 'https://www.toggl.com/reports/api/v2',
  reports_get: function(pth,next) {
    request
      .get(this._reports_url+pth, function(err,res, body){
        if(err){
          return next(err);
        }
        next(null, JSON.parse(body));
      })
      .auth(process.env.TOGGL_API_TOKEN, 'api_token', true);
  },
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

module.exports.byDesc = function(descs, wid, cb) {
  async.map(descs, function(desc, next) {
    async.map(['year', 'month', 'week'], function(type, next) {
      var url = '/summary?'+
        qs.stringify({
          since:moment().startOf(type).toISOString(),
          user_agent: 'Aleksej Kamynin <zendzirou@gmail.com>',
          workspace_id: parseInt(wid),
          description: desc});

      toggl.reports_get(url, function(err, data){
        if(err){ return next(err); }
        data._desc = desc;
        data._type = type;
        next(null, data);
      });
    }, next);
  }, function(err, data){
    if(err){
      return cb(err);
    }
    cb(null, _.chain(data).flatten(true).groupBy('_type').mapObject(function(group) {
      return Math.floor(_.chain(group)
        .pluck('total_grand')
        .map(function(itm) {
          return itm + 0;
        })
        .reduce(function(memo, i){
          return memo + i;
        })
        .value() / 1000);
    }).mapObject(function(sec){
      var h = Math.floor(sec / 3600);
      var m = Math.floor((sec - h*3600) / 60);
      var human = h+':'+(m<10 ? '0'+m : m);
      return {
        duration: sec,
        human: human
      };
    }).value());
  });
};
