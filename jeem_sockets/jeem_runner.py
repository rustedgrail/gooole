import tornado.websocket
import random, simplejson, string, traceback

class WSHandler(tornado.websocket.WebSocketHandler):
    
    def open(self):
        self.id = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(6))
        self.publication = None
        # print 'new connection added %s' % (self.id)

        jeem.client_count+=1
        jeem.clients[self.id] = self
        self.write_message("Hello %s" % (self.id))
      
    def on_message(self, message):
        # print 'message received %s from %s' % (message, self.id)
        message_obj = simplejson.loads(message)

        event = message_obj.get('event')
        parameters = message_obj.get('parameters')
        jd.events[event](self, **parameters)

    def on_close(self):
        # print 'closing %s connection' % (self.id)
        del jeem.clients[self.id]
        jeem.client_count-=1
    
class Jeem(object):
    
    def __init__(self):
        self.clients = {}
        self.votes = {}
        self.client_count = 0
    
    def reset_votes(self): self.votes = {}

class JeemEvents(object):
    
    def publish(self, ws, message):
        # print 'publish action from %s: %s' % (ws.id, message)
        ws.publication = message
        
        publish_count = 0
        for ws_id in jeem.clients:
            if jeem.clients[ws_id].publication: publish_count+=1
        if jeem.client_count == publish_count: self.broadcast()
    
    def vote(self, ws, message):

        ballot_count = 0
        ws_id_ballot = message
        if jeem.votes.get(ws_id_ballot): jeem.votes[ws_id_ballot]+=1
        else: jeem.votes[ws_id_ballot] = 1
        
        for ws_id in jeem.votes: ballot_count+=jeem.votes[ws_id]
        print ballot_count, jeem.client_count
        
        if ballot_count == jeem.client_count:
            vote_count = 0
            winner = ws.id # shady default
            for ws_id in jeem.votes:
                if jeem.votes[ws_id] > vote_count:
                    winner = ws_id
                    vote_count = jeem.votes[ws_id]
            self.broadcast({'winner': winner})
            jeem.reset_votes()
        
    def broadcast(self, publication=None):
        data = {}
        for ws_id in jeem.clients: 
            data[ws_id] = jeem.clients[ws_id].publication

        if publication: data = publication
        for ws_id in jeem.clients:
            jeem.clients[ws_id].write_message(simplejson.dumps({'publication': data}))

class JeemDispatcher(object):
    
    def __init__(self): 
        self.events = { 
            'vote': JeemEvents().vote
            , 'publish': JeemEvents().publish
        }

jeem = Jeem()
jd = JeemDispatcher()