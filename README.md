# Toggl stats

Fetch today stats from toggl

## Installation

Ensure that you have variable in your .bashrc:
```
export TOGGL_API_TOKEN='...............'
```

Api token from here https://toggl.com/app/profile

## Usage

From cli:
```sh
$ npm i -g toggl-stats
$ toggl-stats
- 0:15 working on toggl-stats
- 0:44 petting my dog
* 0:05 writing readme for toggl-stats
```

From js:
```js
var ts = require('toggl-stats');

ts(function(err,data){
  if(err){
    return console.log(err);
  }

  data.forEach(function(itm){
    console.log("%s %s %s", 
                (itm.active ? '*' :'-'),
                itm.human,
                itm.description);
  });
});
```
