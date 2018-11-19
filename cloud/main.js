var appQueryLimit = 99999;
var appQueryLimitMin = 10000;
var wordcut = require("wordcut");
var _ = require('underscore');
var stringSimilarity = require('string-similarity');

wordcut.init();

Parse.Cloud.define('hello', function(req, res) {
  return 'Hongtae';
});

Parse.Cloud.define('testMsg', function(req, res) {
  var msgFromUser = req.params.msg;
  console.log("msg from user:" + msgFromUser);
  res.success({
    "msg": msgFromUser,
    "replyMsg": "FUCK"
  });
});

// Parse.Cloud.define('botTraining', function(request, response) {
//   var MSG = Parse.Object.extend("Message");
//   var msgFromUser = request.params.msg;
//   var replyMsgFromUser = request.params.replyMsg;
//   //console.log("msg from user:" + msgFromUser + "\nreplyMsgFromUser:" + replyMsgFromUser);
//   if (replyMsgFromUser == null || msgFromUser == null) {
//     response.error("request null values");
//   } else {
//     var query = new Parse.Query(MSG);
//     query.containedIn("msg", msgFromUser);
//     query.limit(appQueryLimit);
//     query.find({
//       success: function(msgResponse) {
//         var contents = [];
//         if (msgResponse.length == 0) {
//           // add new msg
//           var msgOBJ = new MSG();
//           msgOBJ.set("msg", msgFromUser);
//           msgOBJ.set("replyMsg", replyMsgFromUser);
//           var msgChar = msgFromUser.join('');
//           var wc = wordcut.cut(msgChar)
//           let arr = wc.split('|');
//           msgOBJ.set("wordsArray", arr);
//           msgOBJ.save(null, {
//             success: function(success) {
//               response.success({
//                 "msg": msgFromUser,
//                 "replyMsg": replyMsgFromUser
//               });
//             },
//             error: function(error) {
//               response.error("save failed : " + error.code);
//             }
//           });
//         } else {
//           // put another reply
//           var msgOBJ = new MSG();
//           msgOBJ = msgResponse[0];
//           for (var i = 0; i < msgFromUser.length; i++) {
//             var msgChar = msgFromUser[i];
//             var wc = wordcut.cut(msgChar)
//             let arr = wc.split('|');
//             msgOBJ.addUnique("wordsArray", arr);
//             msgOBJ.addUnique("msg", msgFromUser[i]);
//           }
//           for (var i = 0; i < replyMsgFromUser.length; i++) {
//             msgOBJ.addUnique("replyMsg", replyMsgFromUser[i]);
//           }
//           msgOBJ.save(null, {
//             success: function(success) {
//               response.success({
//                 "msg": msgFromUser,
//                 "replyMsg": replyMsgFromUser
//               });
//             },
//             error: function(error) {
//               response.error("save failed : " + error.code);
//             }
//           });
//         }
//         //response.success(msgResponse);
//       },
//       error: function() {
//         response.error("get replyMsg failed");
//       }
//     });
//   } // end else
// });