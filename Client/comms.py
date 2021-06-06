import config as globals
import sys
import asyncio
import configparser

def clearDefaultConnection():
	print("Clearing default connection")
	details = { 'host': '', 'name': '', 'port': -1 }
	setDefaultConnection(details)
	print(getDefaultConnection())

def setDefaultConnection(details):
	print("Setting default connection")
	print(details)
	config = configparser.ConfigParser()
	config['DEFAULT_CONNECTION'] = {
		'host': str(details['host']),
		'name': str(details['name']),
		'port': int(details['port'])
	}
	with open('config.ini', 'w') as configFile:
		config.write(configFile)

def getDefaultConnection():
	print("Getting default connection")
	defaultConnection = {}
	config = configparser.ConfigParser()
	config.read('config.ini')
	for key in config['DEFAULT_CONNECTION']:
		defaultConnection[key] = config['DEFAULT_CONNECTION'][key]
	print(defaultConnection)
	return defaultConnection

def waitForPairRequest():
	print("Waiting for pair...")
	child = globals.pexpect.spawn('sudo bluetoothctl')
	child.logfile = sys.stdout.buffer
	child.sendline('agent off')
	child.sendline('agent on')
	child.sendline('default-agent')
	child.sendline('discoverable on')
	child.sendline('pairable on')

	# Waiting for pair request
	try:
		child.expect(r'Confirm passkey ([0-9]){6}', timeout=60)
		child.sendline('yes')
		child.sendline()
		# TODO: Format passkey
		_result = child.after.decode('utf-8')

		# Check if we've cancelled waiting for pair request
		# Meaning we dont need a ui update.
		if globals.waitingForPairRequest is True:
			globals.eel.notifyPairRequest(_result)

		# Wait for pair result
		try:
			# Then we expect the 'Paired: yes' string (pair succeeded)
			child.expect('Paired: yes', timeout=30)
			# Call javascript function directly with True (paired)
			globals.eel.notifyPairResult(True)
		except:
			print("Exception")
			# Call javascript function directly with False (failed to pair)
			globals.eel.notifyPairResult(False)

	except:
		print("Exception")
		# Check if we've cancelled waiting for pair request
		# Meaning we dont need a ui update.
		if globals.waitingForPairRequest is True:
			globals.eel.notifyPairRequest(None)


def findServices():
	print("Finding services...")

	addr = None
	uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"
	serviceMatches = globals.bluetooth.find_service(uuid=uuid, address=addr)

	if len(serviceMatches) == 0:
	    print("Couldn't find the SampleServer service.")
	    return False
	else:
		print("Found the SampleServer!")
		return serviceMatches

def connectToService(service):
	if globals.sock is None:
		globals.refreshSock()

	first_match = service
	port = int(first_match["port"])
	name = str(first_match["name"])
	host = str(first_match["host"])
	print("Connecting to \"{}\" on {}".format(name, host))

	# Connect
	try:
		globals.sock.connect((host, port))
		globals.currentConnection = first_match
		print("Connected")
		return True;
	except globals.bluetooth.BluetoothError as err:
		# Refresh new sock object on error ?
		globals.sock.close()
		globals.refreshSock()
		print("Failed to connect")
		print("Bluetooth error", err)
		return False;

def disconnectFromService():
	print("Disconnecting from service")
	if globals.sock is not None:
		globals.currentConnection = None
		globals.sock.close()
		globals.sock = None

def send(value):
	if globals.currentConnection is not None:
		print("Sending: ", value)
		globals.sock.send(value)


@globals.eel.expose
def checkConnection():
	# If we're disconnected but don't know it yet
	if globals.currentConnection is not None:
		try:
			connected = globals.sock.getpeername()
		except:
			print("Disconnected")
			globals.eel.notifyDisconnection()
			disconnectFromService()
			globals.refreshSock()
