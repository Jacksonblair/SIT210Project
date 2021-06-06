# Contains both temporary config
# And access to config.ini file

# bluetooth module
import bluetooth

# pexpect library (spawning child process for using bluetoothctl)
import pexpect

# Eel + monkey patch
# https://github.com/ChrisKnott/Eel
import gevent.monkey 
gevent.monkey.patch_all()
import eel

# Client bluetooth socket
sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)

def refreshSock():
	global sock
	sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)

# current connection status
currentlyConnected = False

# current connection details
currentConnection = None

# Services found from scan
foundServices = None

# 'Waiting for pair request' status
waitingForPairRequest = False

# Connection Object:
	# .name, .service-id, .port, .host (server MAC address), + more
