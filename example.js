#!/usr/bin/env node

var ts = require('./index.js');

ts(function(err,data){
  if(err){
    return console.log(err);
  }
  for (var i in data) {
    console.log('Workspace: ' +i);
    data[i].forEach(function(itm){
      console.log("%s %s %s", 
                  (itm.active ? '*' :'-'),
                  itm.human,
                  itm.description);
    });
  }
});
