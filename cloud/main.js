var appQueryLimit = 99999;
var appQueryLimitMin = 10000;
var wordcut = require("wordcut");
var _ = require('underscore');
var stringSimilarity = require('string-similarity');
var regex = require("regex");

wordcut.init('cloud/customdict.txt', true);
console.log(wordcut.cut("ไทยแลนด์ กินข้าวยัง สุนัขคือหมา"));


Parse.Cloud.define('hello', function (req, res) {
  res.success('Hi');
});

Parse.Cloud.define('testMsg', function (req, res) {
  var msgFromUser = req.params.msg;
  //console.log("msg from user:" + msgFromUser);
  res.success({
    "msg": msgFromUser,
    "replyMsg": "Good"
  });
});

Parse.Cloud.define('getReplyMsg', function (request, response) {
  getReplyMsg(request, {
    success: function (result) {
      response.success(result);
    },
    error: function (error) {
      response.error(error);
    }
  });
});
///////////////////////////
Parse.Cloud.define('getSynonym', function (request, response) {
  getSynonym(request, {
    success: function (result) {
      response.success(result);
    },
    error: function (error) {
      response.error(error);
    }
  });
});

///////////////////////////
function getReplyMsg(request, response, msgFromUser) {
  var MSG = Parse.Object.extend("Message");
  var query = new Parse.Query(MSG);
  var msgFromUser = request.params.msg;
  if (msgFromUser != '' || msgFromUser != null) {
    getSynonym(msgFromUser);
    console.log(getSynonym(msgFromUser));
  }
  console.log("Before Replace : " + request.params["msg"]);
  console.log("After Replace : " + msgFromUser);

  if (msgFromUser == null) {
    response.error("request null values");
  } else {
    var wc = wordcut.cut(msgFromUser)
    let arr = wc.split('|');
    var msgChar = arr.join('.*');

    query.matches("msg", '.*' + msgChar + '.*');
    query.limit(appQueryLimit);
    query.find({
      success: function (msgResponse) {
        var contents = [];
        if (msgResponse.length == 0) {
          response.success({
            "msg": msgFromUser,
            "replyMsg": ""
          });
        } else {
          contents = msgResponse[0].get("replyMsg");
          ////console.log("msgResponse:" + msgResponse);
          ////console.log("contents:" + contents);
          var replyCount = contents.length;
          //console.log("replyCount:" + replyCount);
          if (replyCount == 0) {
            response.success({
              "msg": msgFromUser,
              "replyMsg": ""
            });
            //console.log("resultReplyMsg:" + "0");
          } else {
            var randomIndex = Math.floor((Math.random() * replyCount) + 0);
            //console.log("randomIndex:" + randomIndex);
            var resultReplyMsg = contents[randomIndex].toString();
            response.success({
              "msg": msgFromUser,
              "replyMsg": resultReplyMsg
            });
            //console.log("resultReplyMsg:" + resultReplyMsg);
          }
        }
        //response.success(msgResponse);
      },
      error: function () {
        response.error("get replyMsg failed");
      }
    });
  }
}

////////////////////////////
Parse.Cloud.define('botTraining', function (request, response) {
  var MSG = Parse.Object.extend("Message");
  var msgFromUser = request.params.msg;
  var replyMsgFromUser = request.params.replyMsg;
  //console.log("msg from user:" + msgFromUser + "\nreplyMsgFromUser:" + replyMsgFromUser);
  if (replyMsgFromUser == null || msgFromUser == null) {
    response.error("request null values");
  } else {
    var query = new Parse.Query(MSG);
    query.containedIn("msg", msgFromUser);
    query.limit(appQueryLimit);
    query.find({
      success: function (msgResponse) {
        var contents = [];
        if (msgResponse.length == 0) {
          // add new msg
          var msgOBJ = new MSG();
          msgOBJ.set("msg", msgFromUser);
          msgOBJ.set("replyMsg", replyMsgFromUser);
          var msgChar = msgFromUser.join('');
          var wc = wordcut.cut(msgChar)
          let arr = wc.split('|');
          msgOBJ.set("wordsArray", arr);
          msgOBJ.save(null, {
            success: function (success) {
              response.success({
                "msg": msgFromUser,
                "replyMsg": replyMsgFromUser
              });
            },
            error: function (error) {
              response.error("save failed : " + error.code);
            }
          });
        } else {
          // put another reply
          var msgOBJ = new MSG();
          msgOBJ = msgResponse[0];
          for (var i = 0; i < msgFromUser.length; i++) {
            var msgChar = msgFromUser[i];
            var wc = wordcut.cut(msgChar)
            let arr = wc.split('|');
            msgOBJ.addUnique("wordsArray", arr);
            msgOBJ.addUnique("msg", msgFromUser[i]);
          }
          for (var i = 0; i < replyMsgFromUser.length; i++) {
            msgOBJ.addUnique("replyMsg", replyMsgFromUser[i]);
          }
          msgOBJ.save(null, {
            success: function (success) {
              response.success({
                "msg": msgFromUser,
                "replyMsg": replyMsgFromUser
              });
            },
            error: function (error) {
              response.error("save failed : " + error.code);
            }
          });
        }
        //response.success(msgResponse);
      },
      error: function () {
        response.error("get replyMsg failed");
      }
    });
  } // end else
});
//////////////////////////////
Parse.Cloud.define('createUnknowMsg', function (request, response) {
  var MSG = Parse.Object.extend("UnknownMessage");
  var msgFromUser = request.params.msg;
  var replyMsgFromUser = request.params.replyMsg;

  //console.log("msg from user:" + msgFromUser + "\nreplyMsgFromUser:" + replyMsgFromUser);
  if (msgFromUser == null) {
    response.error("request null values");
  } else {
    var query = new Parse.Query(MSG);
    query.containedIn("msg", msgFromUser);
    query.limit(appQueryLimit);
    query.find({
      success: function (msgResponse) {
        var contents = [];
        if (msgResponse.length == 0) {
          // add new msg
          var msgOBJ = new MSG();
          msgOBJ.set("msg", msgFromUser);
          msgOBJ.set("replyMsg", replyMsgFromUser);
          msgOBJ.save(null, {
            success: function (success) {
              response.success({
                "msg": msgFromUser
              });
            },
            error: function (error) {
              response.error("save failed : " + error.code);
            }
          });
        }
        //response.success(msgResponse);
      },
      error: function () {
        response.error("find failed");
      }
    });
  } // end else
});

/////////////////////////////////////
Parse.Cloud.define("findBestMsgFromUnknow", function (request, response) {
  var MSG = Parse.Object.extend("Message");
  var query = new Parse.Query(MSG);
  var msgFromUser = request.params.msg;
  var wc = wordcut.cut(msgFromUser)
  let arr = wc.split('|');
  if (msgFromUser == null) {
    response.error("request null values");
  } else {
    query.containedIn("wordsArray", arr);
    query.limit(appQueryLimit);
    query.find({
      success: function (msgResponse) {
        var contents = [];
        if (msgResponse.length == 0 || msgResponse == null) {
          response.success({
            "msg": msgFromUser,
            "replyMsg": ""
          });
        } else {
          var msgArray = [];
          _.each(msgResponse, function (obj) {
            var msgs = obj.get('msg');
            _.each(msgs, function (msg) {
              msgArray.push(msg);
            });
          });
          var matches = stringSimilarity.findBestMatch(msgFromUser, msgArray);
          console.log("matches:" + JSON.stringify(matches));
          console.log("best matches:" + JSON.stringify(matches.bestMatch));
          var target = matches.bestMatch.target;
          //console.log("result bestMatch target:" + target);

          getReplyMsg({
            params: {
              msg: target
            }
          }, {
              success: function (result) {
                //console.log("result:" + JSON.stringify(result));
                response.success({
                  "msg": msgFromUser,
                  "replyMsg": result.replyMsg
                });
              },
              error: function (error) {
                response.error(error);
              }
            });
        }
        //response.success(msgResponse);
      },
      error: function () {
        response.error("get replyMsg failed");
      }
    });
  }
});
//////////////////////
Parse.Cloud.define('addSynonym', function (request, response) {
  var SYN = Parse.Object.extend("Synonym");
  var CommonwordFromUser = request.params.common_word;
  var SynonymwordFromUser = request.params.synonym_word;
  if (CommonwordFromUser == null || SynonymwordFromUser == null) {
    response.error("request null values");
  } else {
    var query = new Parse.Query(SYN);
    query.containedIn("common_word", CommonwordFromUser);
    query.limit(appQueryLimit);
    query.find({
      success: function (synResponse) {
        var contents = [];
        if (synResponse.length == 0) {
          var synOBJ = new SYN();
          synOBJ.set("common_word", CommonwordFromUser);
          synOBJ.set("synonym_word", SynonymwordFromUser);
          var msgChar = CommonwordFromUser.join('');
          var wc = wordcut.cut(msgChar)
          let array = wc.split('|');
          synOBJ.set("synArray", array);
          synOBJ.save(null, {
            success: function (success) {
              response.success({
                "common_word": CommonwordFromUser,
                "synonym_word": SynonymwordFromUser
              });
            },
            error: function (error) {
              response.error("save failed : " + error.code);
            }
          });
        } else {
          // put another reply
          var synOBJ = new SYN();
          synOBJ = synResponse[0];
          for (var i = 0; i < CommonwordFromUser.length; i++) {
            var msgChar = CommonwordFromUser[i];
            var wc = wordcut.cut(msgChar)
            let arr = wc.split('|');
            synOBJ.addUnique("synArray", arr);
            synOBJ.addUnique("common_word", CommonwordFromUser[i]);
          }
          for (var i = 0; i < SynonymwordFromUser.length; i++) {
            synOBJ.addUnique("synonym_word", SynonymwordFromUser[i]);
          }
          synOBJ.save(null, {
            success: function (success) {
              response.success({
                "common_word": CommonwordFromUser,
                "synonym_word": SynonymwordFromUser
              });
            },
            error: function (error) {
              response.error("save failed : " + error.code);
            }
          });
        }
        //response.success(msgResponse);
      },
      error: function () {
        response.error("get Synonym failed");
      }
    });
  } // end else
});

///////////////////////
function getSynonym(request, response) {
  var strtest = request;
  var SYN = Parse.Object.extend("Synonym");
  var query = new Parse.Query(SYN);
  query.find({
    success: function (result) {
      var common_word = "";
      var synonym_word = "";
      for (var i = 0; i < result.length; i++) {
        common_word = result[i].get("common_word");
        synonym_word = result[i].get("synonym_word");
        strtest = strtest.replace(new RegExp(common_word, 'g'), synonym_word);
      }
      return (strtest);
    },
    error: function () {
      response.error("failed");
    }
  });
};

/////////////////////////
