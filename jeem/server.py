import tornado.httpserver
import tornado.ioloop
import tornado.web

from runner import *
from handler import WSHandler
 
application = tornado.web.Application([
    (r'/', WSHandler),
])

if __name__ == "__main__":
	http_server = tornado.httpserver.HTTPServer(application)
	http_server.listen(8888)
	tornado.ioloop.IOLoop.instance().start()
