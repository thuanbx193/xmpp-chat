var server = 'meet.jit.si';
// var BOSH_SERVICE = '//meet.jit.si/xmpp-websocket';
var BOSH_SERVICE = '//meet.jit.si/http-bind';
var ROOM = 'room1@conference.' + server;
var ROOM_SERVICE = 'conference.' + server;
var connection = null;
var eventEmitter;

function log(msg) {
  $('#log').append('<div></div>').append(document.createTextNode(msg));
  console.log(msg);
}

function onConnect(status) {
  if (status == Strophe.Status.CONNECTING) {
    log('Strophe is connecting.');
  } else if (status == Strophe.Status.CONNFAIL) {
    log('Strophe failed to connect.');
    $('#connect').get(0).value = 'connect';
  } else if (status == Strophe.Status.DISCONNECTING) {
    log('Strophe is disconnecting.');
  } else if (status == Strophe.Status.DISCONNECTED) {
    log('Strophe is disconnected.');
    $('#connect').get(0).value = 'connect';
  } else if (status == Strophe.Status.CONNECTED) {
    log('Strophe is connected.');
    $('#to').get(0).value = connection.jid; // full JID
    // set presence
    connection.send($pres());
    // set handlers
    connection.addHandler(onMessage, null, 'message', null, null, null);
    connection.addHandler(onSubscriptionRequest, null, "presence", "subscribe");
    connection.addHandler(onPresence, null, "presence");
    connection.addHandler(onPresenceUnavailable, null, "unavailable");
    connection.addHandler(onPresenceUnavailable, null, "unavailable");
    
    connection.muc.init(connection);
    eventEmitter = chatRoom.eventEmitter;
    
    listRooms();
  }
}

function onMessage(msg) {
  var to = msg.getAttribute('to');
  var from = msg.getAttribute('from');
  var type = msg.getAttribute('type');
  var elems = msg.getElementsByTagName('body');

  if (type == "chat" && elems.length > 0) {
    var body = elems[0];
    log('CHAT: I got a message from ' + from + ': ' + Strophe.getText(body));
    $("#renderchatO2O").append('<div></div>').append(Strophe.getText(body));
  }
  if (type == "groupchat" && elems.length > 0) {
    var body = elems[0];
    log('CHAT: I got a message from ' + from + ': ' + Strophe.getText(body));
    $("#renderchatRoom").append('<div></div>').append(Strophe.getText(body));
  }
  // we must return true to keep the handler alive.  
  // returning false would remove it after it finishes.
  return true;
}

function sendMessage(msg) {
  log('CHAT: Send a message to ' + $('#to').get(0).value + ': ' + msg);

  var m = $msg({
    to: $('#to').get(0).value,
    from: $('#to').get(0).value,
    type: 'chat'
  }).c("body").t(msg);
  connection.send(m);
}
function sendMessageRoom(msg) {
  log('CHAT: Send a message to ' + ROOM_SERVICE + ': ' + msg);

  var m = $msg({
    to: ROOM,
    from: $('#to').get(0).value,
    type: 'groupchat'
  }).c("body").t(msg);
  connection.send(m);
}

function setStatus(s) {
  log('setStatus: ' + s);
  var status = $pres().c('show').t(s);
  connection.send(status);
}

function subscribePresence(jid) {
  log('subscribePresence: ' + jid);
  connection.send($pres({
    to: jid,
    type: "subscribe"
  }));
}

function getPresence(jid) {
  log('getPresence: ' + jid);
  var check = $pres({
    type: 'probe',
    to: jid
  });
  connection.send(check);
}

function getRoster() {
  log('getRoster');
  var iq = $iq({
    type: 'get'
  }).c('query', {
    xmlns: 'jabber:iq:roster'
  });
  connection.sendIQ(iq, rosterCallback);
}

function sendPres() {
  var pres = $pres({ to:ROOM });
  pres.c("thuanbx");
  pres.t("thaunbx value");
  pres.up()
  connection.send(pres);
}
function sendPres1() {
  var pres1 = $pres({to:ROOM});
  pres1.c("sendPres1");
  pres1.t("sendPres1 value");
  pres1.up()
  connection.send(pres1);
}
function rosterCallback(iq) {
  log('rosterCallback:');
  $(iq).find('item').each(function() {
    var jid = $(this).attr('jid'); // The jabber_id of your contact
    // You can probably put them in a unordered list and and use their jids as ids.
    log('   >' + jid);
  });
}

function onSubscriptionRequest(stanza) {
  if (stanza.getAttribute("type") == "subscribe") {
    var from = $(stanza).attr('from');
    log('onSubscriptionRequest: from=' + from);
    // Send a 'subscribed' notification back to accept the incoming
    // subscription request
    connection.send($pres({
      to: from,
      type: "subscribed"
    }));
  }
  return true;
}

function onPresence(presence) {
  log('onPresence:');
  console.log(presence)
  var presence_type = $(presence).attr('type'); // unavailable, subscribed, etc...
  var from = $(presence).attr('from'); // the jabber_id of the contact
  if (!presence_type) presence_type = "online";
  log(' >' + from + ' --> ' + presence_type);
  if (presence_type != 'error') {
    if (presence_type === 'unavailable') {
      // Mark contact as offline
    } else {
      var show = $(presence).find("show").text(); // this is what gives away, dnd, etc.
      if (show === 'chat' || show === '') {
        // Mark contact as online
      } else {
        // etc...
      }
    }
  }
  return true;
}

function listRooms() {
  log("listRooms: " + server);
  connection.muc.listRooms(server, function(msg) {
    log("listRooms - success: ");
    console.log(msg);
    $(msg).find('item').each(function() {
      var jid = $(this).attr('jid'),
        name = $(this).attr('name');
      log(' >room: ' + name + ' (' + jid + ')');
    });
  }, function(err) {
    log("listRooms - error: " + err);
  });
}

function enterRoom(room) {
  var jid = $('#to').get(0).value;
  log("enterRoom: " + room + ", " + jid);
  connection.muc.join(room, jid, room_msg_handler, room_pres_handler);
  //connection.muc.setStatus(room, $('#jid').get(0).value, 'subscribed', 'chat');
}

function room_msg_handler(a, b, c) {
  log('MUC: room_msg_handler');
  return true;
}

function room_pres_handler(a, b, c) {
  log('MUC: room_pres_handler');
  return true;
}

function onCreateRoomSuccess(stanza) {
    log('MUC: onCreateRoomSuccess: '+stanza);
    return true;
}

function onCreateRoomError(stanza) {
    log('MUC: onCreateRoomError: '+stanza);
    return true;
}

function exitRoom(room) {
  log("exitRoom: " + room);
  //TBD
}

function createRoom(room, descr, subject) {
  log("createRoom: " + room);
  // join the room
  connection.muc.join(room, $('#to').get(0).value, room_msg_handler, room_pres_handler);
  var config = {"muc#roomconfig_publicroom": "1", "muc#roomconfig_persistentroom": "1"};
  if (descr)  config["muc#roomconfig_roomdesc"] = descr;
  if (subject)  config["muc#roomconfig_subject"] = subject;
    connection.muc.createConfiguredRoom(room, config, onCreateRoomSuccess, onCreateRoomError);
}

function rawInput(data) {
  console.log('RECV: ' + data);
}

function rawOutput(data) {
  console.log('SENT: ' + data);
}

$(document).ready(function() {

  // $('#jid').get(0).value = "admin@vcrxdev10.topica.vn";
  // $('#pass').get(0).value = "123456";

  $('#connect').bind('click', function() {
    var url = BOSH_SERVICE;
    connection = new Strophe.Connection(url);
    connection.rawInput = rawInput;
    connection.rawOutput = rawOutput;
    var button = $('#connect').get(0);
    if (button.value == 'connect') {
      button.value = 'disconnect';
      // connection.connect($('#jid').get(0).value, $('#pass').get(0).value, onConnect);
      connection.connect(server, null, onConnect);
    } else {
      	button.value = 'connect';
		connection.options.sync = true;
       	connection.flush();
		connection.disconnect("disconnect");
    }
  });
 $('#send').bind('click', function() {
    var msg = $('#msg').val();
    sendMessage(msg);
  });

  $('#sendMsgRoom').bind('click', function() {
    var msg = $('#msgRoom').val();
    sendMessageRoom(msg);
  });
  $('#btnGetPres').bind('click', function() {
    var jid = $('#to').val();
    getPresence(jid);
  });

  $('#btnSubPres').bind('click', function() {
    var jid = $('#to').val();
    subscribePresence(jid);
  });

  $('#btnRoster').bind('click', function() {
    getRoster();
  });

  $('#btnAway').bind('click', function() {
    setStatus('away');
  });

  $('#room').val(ROOM);

  $('#btnEnter').bind('click', function() {
    enterRoom($('#room').val());
  });

  $('#btnExit').bind('click', function() {
    exitRoom($('#room').val());
  });
  
  $('#btnList').bind('click', function() {
    listRooms();
  });
  
  $('#btnCreateRoom').bind('click', function() {
    createRoom($('#room').val());
  });
  $('#btnSend').bind('click', function() {
   sendPres();
  });
   $('#btnSend1').bind('click', function() {
   sendPres1();
  });
  	$(window).bind('unload', function(){
		connection.options.sync = true;
		connection.flush();
		connection.disconnect();
	});
});