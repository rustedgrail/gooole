function socketTown() {
    var ws, clients = 1, count = 0;
    var socket_events = {
        close: close_conn,
        client_count: client_count,
        next_round: next_round,
        submission: submission,
        vote_cast: vote_cast
    }

    function init() {
        var host = 'localhost';
        var port = '8888';
        var uri = '';

        ws = new WebSocket("ws://" + host + ":" + port + uri);

        ws.onclose = function(evt) {
            document.getElementsByTagName('body')[0].innerHTML = 'Connection to server closed';
        };

        ws.onmessage = function(evt) {
            data = JSON.parse(evt.data);
            if (data.publication.event) {
                var e = data.publication.event;
                var p = data.publication.params;
                socket_events[e](p);
            }
            else if (socks.callback) {
                socks.callback(data);
            }
        };
    }

    function send(event, message, callback) {
        socks.callback = callback;
        var message = {event: event, parameters: {message: message}}
        ws.send(JSON.stringify(message));
    }

    function close_conn(message) {
        document.getElementsByTagName('body')[0].innerHTML = message;
    }

    function submission(submission_count) {
        document.getElementById('whatsLeft').innerHTML = 'Submissions Left: ';
        count = submission_count;
        updateCount(clients - submission_count);
    }

    function client_count(client_count) {
        clients = client_count;
        updateCount(client_count - count);
    }

    function vote_cast(vote_count) {
        document.getElementById('whatsLeft').innerHTML = 'Votes Left: ';
        count = vote_count;
        updateCount(clients - vote_count);
    }

    function updateCount(count) {
        document.getElementById('submission_count').innerHTML = count;
    }

    function next_round(round) {
        document.getElementById('round_count').innerHTML = round;
        count = clients;
        updateCount(clients);
    }

    return {
        init: init,
        send: send,
        close: close_conn
    }
}

socks = socketTown();
socks.init();

