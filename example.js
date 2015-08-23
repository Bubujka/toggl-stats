#!/usr/bin/env node

var ts = require('./index.js');

ts(function(err,data){
  if(err){
    return console.log(err);
  }

  data.forEach(function(itm){
    console.log("%s %s %s", (itm.active ? '*' :'-'),
                itm.human,
                itm.description);
  });
});
