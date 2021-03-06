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
////////////////////////////
Parse.Cloud.define("FindBestMsg", function (request, response) {
  var MSG = Parse.Object.extend("Message");
  var STW = Parse.Object.extend("Stopword");
  var SYN = Parse.Object.extend("Synonym");
  var query = new Parse.Query(MSG);
  var query2 = new Parse.Query(STW);
  var query3 = new Parse.Query(SYN);
  var msgFromUser = request.params.msg;

  if (msgFromUser != '' || msgFromUser != null) {
    query2.find({
      success: function (result) {
        var stopword = "";
        for (var i = 0; i < result.length; i++) {
          stopword = result[i].get("stopword");
          msgFromUser = msgFromUser.replace(new RegExp(stopword, 'g'), '');
        }
        console.log('After Remove Stop word : ' + msgFromUser)
        if (msgFromUser != '' || msgFromUser != null) { 
          query3.find({
            success: function (result) {
              var common_word = "";
              var synonym_word = "";
              for (var i = 0; i < result.length; i++) {
                common_word = result[i].get("common_word");
                synonym_word = result[i].get("synonym_word");
                msgFromUser = msgFromUser.replace(new RegExp(common_word, 'g'), synonym_word);
              }
              console.log("Synonym Complete : " + msgFromUser);
              var wc = wordcut.cut(msgFromUser)
              let arr = wc.split('|');
              console.log(arr);
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
                    var target = matches.bestMatch.target;
                    var ratings = matches.bestMatch.rating;
                    console.log("Matches:" + JSON.stringify(matches));
                    console.log("Best matches:" + JSON.stringify(matches.bestMatch));
                    console.log("Result bestMatch target:" + target);
                    console.log("Ratings is " + ratings);

                    getReplyMsg({
                      params: {
                        msg: target
                      }
                    }, {
                        success: function (result) {
                          //console.log("result:" + JSON.stringify(result));
                          if (ratings > 0.4) {
                            response.success({
                              "msg": msgFromUser,
                              "replyMsg": result.replyMsg
                            });
                          } else {
                            response.success({
                              "msg": msgFromUser,
                              "replyMsg": "ผมยังไม่เข้าใจคำพูดของคุณ คำตอบของผมอาจจะยังไม่มีในระบบ กรุณาระบุรายละเอียดของข้อความให้มากกว่านี้"
                            });
                          }
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
          })
        } else {
          response.error("request null values");
        }
      }
    })
  } else {
    response.error("request null values");
  }
});
////////////////////////////
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
function getReplyMsg(request, response, msgFromUser) {
  var MSG = Parse.Object.extend("Message");
  var query = new Parse.Query(MSG);
  var msgFromUser = request.params.msg;
  if (msgFromUser != '' || msgFromUser != null) {
    console.log("Best rating form FindBestMsg : " + msgFromUser);
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
          var replyCount = contents.length;
          if (replyCount == 0) {
            response.success({
              "msg": msgFromUser,
              "replyMsg": ""
            });
          } else {
            var randomIndex = Math.floor((Math.random() * replyCount) + 0);
            var resultReplyMsg = contents[randomIndex].toString();
            response.success({
              "msg": msgFromUser,
              "replyMsg": resultReplyMsg
            });
          }
        }
      },
      error: function () {
        response.error("get replyMsg failed");
      }
    });
  }
}
////////////////////////////
Parse.Cloud.define('addSynonym', function (request, response) {
  var SYN = Parse.Object.extend("Synonym");
  var CommonwordFromUser = request.params.common_word;
  var SynonymwordFromUser = request.params.synonym_word;
  if (CommonwordFromUser == null || SynonymwordFromUser == null) {
    response.error("request null values");
  } else {
    var query = new Parse.Query(SYN)
    query.find({
      success: function (synResponse) {
        var synOBJ = new SYN();
        synOBJ.set("common_word", CommonwordFromUser);
        synOBJ.set("synonym_word", SynonymwordFromUser);
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
    })
  }
});
///////////////////////
Parse.Cloud.define('addSentence', function (request, response) {
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
