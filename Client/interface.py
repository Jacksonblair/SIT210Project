import config as globals
import comms as comms

# This client has three main interfaces...
# 	Pairing interface
# 		- Prep for pairing
# 	Connecting interface
# 		- Search and connect to correct service
# 	Peripheral interface

# 		- Display UI, and send any interactions to PC

# eel.expose interface commands to page js script






# Make peripheral pairable 
@globals.eel.expose
def waitForPair():
	globals.waitingForPairRequest = True
	comms.waitForPairRequest()

@globals.eel.expose
def stopWaitingForPair():
	globals.waitingForPairRequest = False

@globals.eel.expose
def pressedFindServices():
	print("Pressed find services....")
	globals.foundServices = comms.findServices()
	print("Returning found services...")
	return globals.foundServices

@globals.eel.expose
def pressedButton(button):
	comms.send(bytes(button))

@globals.eel.expose
def pressedConnect(index):
	# Gives us the index of the service in .. 
	# .. globals.foundServices that we want to connect to
	return comms.connectToService(globals.foundServices[index])

@globals.eel.expose
def pressedDisconnect():
	# Disconnect from current connection
	comms.disconnectFromService()

@globals.eel.expose
def getConnection():
	return globals.currentConnection

# Set a default connection variable to the MAC address of current connection
# Returns True if succeeds, else False
@globals.eel.expose
def setDefaultConnection():
	comms.setDefaultConnection(globals.currentConnection)
	return comms.getDefaultConnection()

# Removes default connection (if the default is the currect connection)
@globals.eel.expose
def clearDefaultConnection():
	comms.clearDefaultConnection()

@globals.eel.expose
def getDefaultConnection():
	return comms.getDefaultConnection()

@globals.eel.expose
def useDefaultConnection():
	return comms.connectToService(getDefaultConnection())

# Checks if we're connected to default connection
@globals.eel.expose
def isConnectedToDefault():
	defaultConnection = comms.getDefaultConnection()
	if defaultConnection is not None and globals.currentConnection is not None:
		if defaultConnection['host'] == globals.currentConnection['host']:
			print("Client is connected to default")
			return True
		else:
			print("Client not connected to default")
			return False
	else:
		print("No connection or no default connection")
		return False
