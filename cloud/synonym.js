var request = require('request');

module.exports = {
    testSynonym: function (requestMsg) {
      return testSynonym(requestMsg);
    }
  };

function testSynonym(messageText) {
    var messageData = messageText;
    if (messageData != '' || messageData != null) {
  ////////////////////////Synonym////////////////////////////
      messageData = messageData.replace(/จับไข้/g, 'เป็นไข้');
      messageData = messageData.replace(/เจ็บป่วย/g, 'เป็นไข้');
      messageData = messageData.replace(/ป่วย/g, 'เป็นไข้');
      messageData = messageData.replace(/ไม่สบาย/g, 'เป็นไข้');
  
      messageData = messageData.replace(/ทานข้าว/g, 'รับประทานอาหาร');
      messageData = messageData.replace(/กินข้าว/g, 'รับประทานอาหาร');
      messageData = messageData.replace(/รับประทานข้าว/g, 'รับประทานอาหาร');
    }
    return messageData;
  }