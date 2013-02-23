import tornado.httpserver
import tornado.ioloop
import tornado.web

from jeem_runner import *
 
application = tornado.web.Application([
    (r'/', WSHandler),
])

if __name__ == "__main__":
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
