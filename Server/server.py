#!/usr/bin/env python3
"""PyBluez simple example rfcomm-server.py
Simple demonstration of a server application that uses RFCOMM sockets.
Author: Albert Huang <albert@csail.mit.edu>
$Id: rfcomm-server.py 518 2007-08-10 07:20:07Z albert $
"""

"""
    TODO:
    - Make tray icon
    - Batch file for startup
    - Trigger windows keypresses 
        - Interface for that 
    - more probably...
"""

"""
    On load...
        Get bindings from config.ini file
        Generate n Binding objects and store them in memory
        Pass to interface when asked for
        Update on interface events

"""

import config as globals
import connection as connection

import time
import threading


def runA():
    while True:
        time.sleep(0.1)

def runB():
    connection.startSocket()

t1 = threading.Thread(target=runA, daemon=True)
t2 = threading.Thread(target=runB, daemon=True)
t1.start()
t2.start()

# Start application
globals.eel.init('web')
globals.eel.start('index.html', block=True, mode='chrome', port=7070, size=(400, 400))

