function socketTown() {
    var ws;
    var round=0;
    var socket_events = {
	close: close_conn
    }

    function init() {
        var host = 'localhost';
        var port = '8888';
        var uri = '';

        ws = new WebSocket("ws://" + host + ":" + port + uri);
        
	ws.onclose = function(evt) { alert("Connection close"); };
        
	ws.onmessage = function(evt) {
            data = JSON.parse(evt.data);
	    if (data.publication.event) {
		var e = data.publication.event;
		var p = data.publication.params;
		socket_events[e](p); }
            else if (socks.callback) { socks.callback(data); }
        };
    }

    function send(event, message, callback) {
        socks.callback = callback;
        var message = {event: event, round: round, parameters: {message: message}}
        ws.send(JSON.stringify(message));
    }

    function close_conn(message) {
	document.getElementsByTagName('body')[0].innerHTML = message;
	ws.close(); 
    }

    return {
        init: init,
        send: send,
        close: close_conn
    }
}

socks = socketTown();
socks.init();

