import simplejson

class Jeem(object):

    def __init__(self):
        self.clients = {}
        self.votes = {}
        self.client_count = 0
        self.round = 0
    
    def reset_votes(self): 
        self.votes = {}

class JeemDispatcher(object):

    def __init__(self):
        self.public_events = {'vote': self.vote, 'publish': self.publish}
        self.jeem = Jeem()

    def update_client_count(self):
	publication = {'event': 'client_count', 'params': self.jeem.client_count}
	self.broadcast(publication)

    def next_round(self):
	self.jeem.round+=1
	publication = {'event': 'next_round', 'params': self.jeem.round}
	self.broadcast(publication)

    def add_client(self, ws):
        if self.jeem.round > 0: return False
        self.jeem.client_count+=1
        self.jeem.clients[ws.id] = ws
	self.update_client_count()
        return True

    def remove_client(self, ws):
        if self.jeem.clients.get(ws.id): 
            del self.jeem.clients[ws.id]
            self.jeem.client_count-=1
	    self.update_client_count()

    def publish(self, ws, message):
        # print 'publish action from %s: %s' % (ws.id, message)
        ws.publication = message
        
        publish_count = 0
        for ws_id in self.jeem.clients:
            if self.jeem.clients[ws_id].publication: publish_count+=1
        # print publish_count, self.jeem.client_count
        if self.jeem.client_count == publish_count: 
            self.jeem.round+=1
            self.broadcast()
	else:
	    publication = {'event': 'submission', 'params': publish_count}
	    self.broadcast(publication)
    
    def vote(self, ws, message):

        ballot_count = 0
        ws_id_ballot = message
        if self.jeem.votes.get(ws_id_ballot): self.jeem.votes[ws_id_ballot]+=1
        else: self.jeem.votes[ws_id_ballot] = 1
        
        for ws_id in self.jeem.votes: ballot_count+=self.jeem.votes[ws_id]
        # print ballot_count, self.jeem.client_count
        
        if ballot_count == self.jeem.client_count:
            vote_count = 0
            winner = ws.id # shady default
            for ws_id in self.jeem.votes:
                if self.jeem.votes[ws_id] > vote_count:
                    winner = ws_id
                    vote_count = self.jeem.votes[ws_id]
            self.broadcast({'winner': winner})
            self.jeem.reset_votes()
	    self.next_round()
	else:
	    publication = {'event': 'vote_cast', 'params': ballot_count}
	    self.broadcast(publication)
        
    def broadcast(self, publication=None):
        data = {}
        for ws_id in self.jeem.clients: 
            data[ws_id] = self.jeem.clients[ws_id].publication

        if publication: data = publication
        for ws_id in self.jeem.clients:
            self.jeem.clients[ws_id].write_message(simplejson.dumps({'publication': data}))
