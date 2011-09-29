var testResourceRe = /^compose\/test\//;
var copyOnly = function(mid){
  return mid in {
    "compose/compose.profile": 1,
    "compose/package.json": 1
  };
};

var profile = {
  resourceTags:{
    test: function(filename, mid){
      return testResourceRe.test(mid) || mid === "compose/test";
    },

    copyOnly: function(filename, mid){
      return copyOnly(mid);
    },

    amd: function(filename, mid){
      return !copyOnly(mid) && (/\.js$/).test(filename);
    }
  },

  trees:[
    [".", ".", /(\/\.)|(~$)/]
  ]
};
