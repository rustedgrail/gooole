import random, string, simplejson
import tornado.websocket
import tornado.httpserver
import tornado.ioloop
import tornado.web

from dispatcher import *

class WSHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        self.id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(6))
        self.publication = None        
        # print 'new connection added %s' % (self.id)

        client_added = jd.add_client(self)
        if not client_added:
            response = {'event': 'close', 'message': 'Game already in progress'}
            self.write_message(simplejson.dumps(response))
        # print "Hello %s" % (self.id)
      
    def on_message(self, message):
        # print 'message received %s from %s' % (message, self.id)
        message_obj = simplejson.loads(message)

        event = message_obj.get('event')
        parameters = message_obj.get('parameters')
        jd.public_events[event](self, **parameters)

    def on_close(self):
        # print 'closing %s connection' % (self.id)
        jd.remove_client(self)
        if jd.jeem.client_count == 0: jd.jeem.round = 0
 
jd = JeemDispatcher()
application = tornado.web.Application([
    (r'/', WSHandler),
])

if __name__ == "__main__":
	http_server = tornado.httpserver.HTTPServer(application)
	http_server.listen(8888)
	tornado.ioloop.IOLoop.instance().start()
