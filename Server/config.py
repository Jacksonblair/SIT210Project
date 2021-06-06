# Eel + monkey patch
# https://github.com/ChrisKnott/Eel
import eel
import configparser
import wexpect
from keydict import keydict

currentConnection = None
client_sock = None

@eel.expose
def connectToPeripheral():
	child = wexpect.spawn('cmd.exe') # Connect to nearby device
	try:
		child.sendline('btpair -n"rpbi" -p1234')
		child.expect('Error', timeout=20)
		return False
	except:
		return False

@eel.expose
def disconnect():
	print("trying to close sock")
	client_sock.close()

@eel.expose
def getConnection():
	if currentConnection is not None:
		return currentConnection
	else:
		return None

@eel.expose
def getBindings():
	# print("Getting bindings")
	bindings = []
	config = configparser.ConfigParser()
	config.read('config.ini')
	for key in config['BINDINGS']:
		bindings.append(config['BINDINGS'][key])
	# print(bindings)
	return bindings

@eel.expose
def getKeyDict():
	return keydict

@eel.expose
def setBinding(value, index):
	print("Setting binding: " + str(value))
	print("At index: " + str(index))

	try:
		config = configparser.ConfigParser()
		config.read('config.ini')
		config.set('BINDINGS', str(index), str(value))
		with open('config.ini', 'w') as configFile:
			config.write(configFile)
		return True
	except:
		return False
