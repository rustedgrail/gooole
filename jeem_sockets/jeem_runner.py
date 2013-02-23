import tornado.websocket
import random, simplejson, string, traceback

class WSHandler(tornado.websocket.WebSocketHandler):
    
    def open(self):
        self.id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(6))
        self.publication = None
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
        # self.round = 0
        # self.bpm = ''
        # self.time_sig = ''
        self.clients = {}

class JeemEvents(object):
    
    def publish(self, ws, message):
        print 'publish action from %s: %s' % (ws.id, message)
        ws.publication = message
        
        ws_count = 0
        publish_count = 0
        for ws_id in jeem.clients:
            if jeem.clients[ws_id].publication: publish_count+=1
            ws_count+=1
        if ws_count == publish_count: self.vote()

    def vote(self):
        vote_on = []
        for ws_id in jeem.clients: 
            publication = jeem.clients[ws_id].publication
            publication['ws_id'] = ws_id
            vote_on.append(publication)

        for ws_id in jeem.clients: 
            jeem.clients[ws_id].write_message(simplejson.dumps({'publication': vote_on}))

class JeemDispatcher(object):
    
    def __init__(self): 
        self.events = { 
            'publish': JeemEvents().publish
        }

jeem = Jeem()
jd = JeemDispatcher()