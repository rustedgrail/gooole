import tornado.websocket
import random, simplejson, string, traceback

class WSHandler(tornado.websocket.WebSocketHandler):
    
    def open(self):
        self.id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(6))
        print 'new connection added %s' % (self.id)

        jeem.clients[self.id] = self
        self.write_message("Hello %s" % (self.id))
      
    def on_message(self, message):
        print 'message received %s from %s' % (message, self.id)
        message_obj = simplejson.loads(message)

        event = message_obj.get('event')
        parameters = message_obj.get('parameters')
        jd.events[event](self, **parameters)

    def on_close(self):
        print 'closing %s connection' % (self.id)
        del jeem.clients[self.id]
    
class Jeem(object):
    def __init__(self): 
        self.round = 0
        self.bpm = ''
        self.time_sig = ''
        self.clients = {}
    
class JeemEvents(object):
    
    def vote(self, ws, message):
        print 'vote action from %s: %s' % (ws.id, message)
        for ws_id in jeem.clients:
            if ws_id == ws.id: continue
            jeem.clients[ws_id].write_message(message)

    # def publish(self, ws, data):

class JeemDispatcher(object):
    
    def __init__(self): 
        self.events = { 
            'vote': JeemEvents().vote
            # , 'publish': JeemEvents().publish
        }

jeem = Jeem()
jd = JeemDispatcher()