let E_connectionInterface, E_mainInterface
let E_connectionStatus = {}
let E_notifier = {}
let E_pairRequest = {}
let E_servicesList = {}
let E_serviceInformation = {}
let E_buttons

/*
	TODO:
	- Route any HTML events through here before communicating to python server
		- This decouples things a bit
*/

let MESSAGES = {
	STATUS_NOT_CONNECTED: "Not connected",
	STATUS_CONNECTED: "Connected to:",
	FOUND_NO_SERVICES: "Did not find any services",
	FINDING_SERVICES: "Finding services...",
	CONNECTING_TO_SERVICE: "Connecting to service:",
	CONNECTED_TO_SERVICE: "Connected to:",
	COULD_NOT_CONNECT: "Could not connect to:",
	COULD_NOT_CONNECT_DEFAULT: "Could not connect to default server",
	SET_DEFAULT_CONNECTION: "Set default connection to:",
	REMOVED_DEFAULT_CONNECTION: "Removed default connection",
	COULD_NOT_SET_DEFAULT_CONNECTION: "Could not set default connection",
	NO_DEFAULT_CONNECTION: "There is no default connection"
}

window.onload = async () => {
	// Get our elements from DOM, prefix with 'E_'

	/* Containers */
	E_connectionInterface = document.getElementById("connection-interface")
	E_mainInterface = document.getElementById("main-interface")

	/* Connection status */
	E_connectionStatus.Parent = document.getElementById("connection-status")
	E_connectionStatus.Message = document.getElementById("connection-status-message")
	E_connectionStatus.ActionButton = document.getElementById("connection-status-action-button")
	E_connectionStatus.ExitButton = document.getElementById("connection-status-exit-button")
	E_connectionStatus.PairButton = document.getElementById("connection-status-pair-button")
	E_connectionStatus.SetDefaultButton = document.getElementById("connection-status-set-default-button")
	E_connectionStatus.ConnectDefaultButton = document.getElementById("connection-status-connect-default-button")

	/* Notifier */
	E_notifier.Parent = document.getElementById("notifier")
	E_notifier.Message = document.getElementById("notifier-message")
	E_notifier.Button = document.getElementById("notifier-button")

	/* Pair Request */
	E_pairRequest.Parent = document.getElementById("pair-request")
	E_pairRequest.Message = document.getElementById("pair-request-message")
	E_pairRequest.CancelButton = document.getElementById("pair-request-cancel-button")

	/* Services List */
	E_servicesList.Parent = document.getElementById("services-list")
	E_servicesList.Services = document.getElementById("services-list-services")
	E_servicesList.ExitButton = document.getElementById("services-list-exit-button")

	/* Service Information */
	E_serviceInformation.Parent = document.getElementById("service-information")
	E_serviceInformation.ServiceName = document.getElementById("service-information-service-name")
	E_serviceInformation.MacAddress = document.getElementById("service-information-mac-address")
	E_serviceInformation.ServiceId = document.getElementById("service-information-service-id")
	E_serviceInformation.PairedStatus = document.getElementById("service-information-paired-status")
	E_serviceInformation.ConnectButton = document.getElementById("service-information-connect-button")
	E_serviceInformation.ExitButton = document.getElementById("service-information-exit-button")

	// Get all button elements
	E_buttons = document.getElementsByClassName("btn");

	/* 
		- ON INITIAL LOAD
			- Empty E_connectionInterface (we have pointers to each sub-interface above)
			- Try to connect to a default connection
				- Show confirmation.
			- If that fails, show connection menu
	*/

	let defaultConnection = await eel.getDefaultConnection()()
	if (defaultConnection.host) {
		showConnectingToService(defaultConnection.name)
		E_connectionInterface.classList = "show"
		// Try to connect
		let result = await eel.useDefaultConnection()()
		if (result) {
			showConnectedToService(defaultConnection.name)
		} else {
			setNotifierAndShow(MESSAGES.COULD_NOT_CONNECT_DEFAULT, () => {
				showConnectionStatus()
			})
		}
	} else {
		// Else show normal connection interface
		console.log("No default connection")
		showConnectionStatus()
	}

	// Set an interval to check connection status every second
	setInterval(() => {
		eel.checkConnection()
	}, 1000)

}

async function pressedButton(number, element) {
	element.classList.remove('pressed')
	element.classList.add('pressed')
	eel.pressedButton(number)
	setTimeout(() => {
		element.classList.remove('pressed')
	}, 300)
}

async function connectToDefault() {
	let defaultConnection = await eel.getDefaultConnection()()
	if (defaultConnection.host) {
		showConnectingToService(defaultConnection.name)
		E_connectionInterface.classList = "show"
		// Try to connect
		let result = await eel.useDefaultConnection()()
		if (result) {
			showConnectedToService(defaultConnection.name)
		} else {
			setNotifierAndShow(MESSAGES.COULD_NOT_CONNECT_DEFAULT, () => {
				showConnectionStatus()
			})
		}
	} else {
		// Else show normal connection interface
		console.log("No default connection")
		setNotifierAndShow(MESSAGES.NO_DEFAULT_CONNECTION, () => {
			showConnectionStatus()
		})
	}
}

function stopWaitingForPair() {
	eel.stopWaitingForPair()
	showConnectionStatus()
}

function waitForPair() {
	// Show 'pairRequest' interface
	setConnectionInterface(E_pairRequest)
	eel.waitForPair()
}

function clickedFindServices() {
	console.log("Clicked find services")
	showFindingServices()
	eel.pressedFindServices()()
	.then(servicesList => {
		if (servicesList) {
			showFoundServices(servicesList)
		} else {
			showFoundNoServices()
		}
	})
}

function clickedDisconnect() {
	console.log("Clicked disconnect")
	eel.pressedDisconnect()
	showConnectionStatus()
}


// Called from python script on disconnect
eel.expose(notifyDisconnection)
function notifyDisconnection() {
	E_connectionInterface.classList = "show"
	setNotifierAndShow("Disconnected", () => {
		showConnectionStatus()
	})
}

// Called from python script when there is pair request
eel.expose(notifyPairRequest)
function notifyPairRequest(result) {
	if (result) {
		setNotifierAndShow(`Pairing... ${result}`, null)
	} else {
		setNotifierAndShow("Timed out", () => {
			showConnectionStatus()
		})
	}
}

// Called from python script when there is a pair result
eel.expose(notifyPairResult)
function notifyPairResult(result) {
	if (result) {
		setNotifierAndShow("Paired succesfully!", () => {
			showConnectionStatus()
		})
	} else {
		setNotifierAndShow("Failed to pair", () => {
			showConnectionStatus()
		})
	}
}

async function showConnectionStatus() {
	console.log("Showing connection status...")
	let connection = await eel.getConnection()() 
	if (connection) {
		showConnectedStatus(connection)
	} else {
		showNotConnectedStatus()
	}
}

async function showNotConnectedStatus() {
	set(E_connectionStatus.Message, MESSAGES.STATUS_NOT_CONNECTED)
	set(E_connectionStatus.ActionButton, "Find services")

	// When not connected, hide 'set default' button
	E_connectionStatus.SetDefaultButton.classList = "hide"

	// Show 'connect to default' button if there is a default connection
	let connection = await eel.getDefaultConnection()()
	if (connection.host) {
		E_connectionStatus.ConnectDefaultButton.classList = "show"
	} else {
		E_connectionStatus.ConnectDefaultButton.classList = "hide"
	}

	// Set action button to find services on click
	E_connectionStatus.ActionButton.removeEventListener('click', clickedDisconnect)
	E_connectionStatus.ActionButton.addEventListener('click', clickedFindServices)

	setConnectionInterface(E_connectionStatus)
}

async function showConnectedStatus(connection) {
	set(E_connectionStatus.Message, `${MESSAGES.STATUS_CONNECTED} ${connection.name}`)	
	set(E_connectionStatus.ActionButton, "Disconnect")

	// When connected, show 'default' button
	// But first get its status (set to default, not set to default)
	E_connectionStatus.SetDefaultButton.classList = "show"
	let isDefault = await eel.isConnectedToDefault()()
	if (isDefault) {
		set(E_connectionStatus.SetDefaultButton, "Remove default")
	} else {
		set(E_connectionStatus.SetDefaultButton, "Set as default")
	}

	// Set action button to disconnect from current service on click
	E_connectionStatus.ActionButton.removeEventListener('click', clickedFindServices)
	E_connectionStatus.ActionButton.addEventListener('click', clickedDisconnect)

	setConnectionInterface(E_connectionStatus)
}

function showFindingServices() {
	setNotifierAndShow(MESSAGES.FINDING_SERVICES, null)
}

function showFoundNoServices() {
	setNotifierAndShow(MESSAGES.FOUND_NO_SERVICES, () => { 
		showConnectionStatus() 
	})
}

function showFoundServices(servicesList) {
	clear(E_servicesList.Services)
	servicesList.map((service, i) => {
		E_servicesList.Services.append(makeServiceButton(service, i))
	})
	setConnectionInterface(E_servicesList)
}

function showConnectingToService(serviceName) {
	setNotifierAndShow(`${MESSAGES.CONNECTING_TO_SERVICE} ${serviceName}`)
}

function showConnectedToService(serviceName) {
	console.log("Showing connected to service")
	setNotifierAndShow(`${MESSAGES.CONNECTED_TO_SERVICE} ${serviceName}`, () => {
		hideConnectionInterface()
	})
}

function showCouldNotConnect() {
	setNotifierAndShow(MESSAGES.COULD_NOT_CONNECT, () => {
		showConnectionStatus()
	})
}

function connect(index, serviceName) {
	showConnectingToService(serviceName)
	eel.pressedConnect(index)()
	.then(result => {
		if (result) {
			showConnectedToService(serviceName)
		} else {
			showCouldNotConnect()
			showError("Could not connect")
		}
	})
}

async function clickedDefault() {
	let connectedToDefault = await eel.isConnectedToDefault()()
	if (connectedToDefault) {
		console.log("Connected to default")
		removeDefault()
	} else {
		console.log("Not connected to default")
		setAsDefault()
	}
}

async function setAsDefault() {
	let connection = await eel.setDefaultConnection()()
	if (connection) {
		setNotifierAndShow(`${MESSAGES.SET_DEFAULT_CONNECTION} ${connection.name}`, () => {
			showConnectionStatus()
		})
	} else {
		setNotifierAndShow(`${MESSAGES.COULD_NOT_SET_DEFAULT_CONNECTION}`, () => {
			showConnectionStatus()
		})
	}
}

async function removeDefault() {
	await eel.clearDefaultConnection()()
	setNotifierAndShow(`${MESSAGES.REMOVED_DEFAULT_CONNECTION}`, () => {
		showConnectionStatus()
	})
}


/* Setting connection interface elements */
function setConnectionInterface(interface) {
	set(E_connectionInterface, "") // Clear interface contents
	E_connectionInterface.appendChild(interface.Parent) // Replace with passed interface arg
}

/* Hiding/showing connection interface */
function showConnectionInterface() {
	/* Show connection status by default when showing connection interface */
	showConnectionStatus()
	E_connectionInterface.classList = "show"
}

function hideConnectionInterface() {
	E_connectionInterface.classList = "hide"
}


let setNotifierAndShow = (text, callback) => {
	set(E_notifier.Message, text)
	
	if (callback != null) { // If theres a callback, show button no notifier to trigger it
		E_notifier.Button.classList = "show"
		E_notifier.Button.addEventListener('click', callback)
	} else { // Else hide the button
		E_notifier.Button.classList = "hide"
	}
	setConnectionInterface(E_notifier)
}

let clear = (el) => {
	el.innerHTML = ""
}
let set = (el, val) => {
	el.innerHTML = val
}


let makeServiceButton = (service, i) => {
	let button = document.createElement('button')
	set(button, service.name)
	button.addEventListener('click', () => {
		console.log("Clicked service")
		connect(i, service.name)
	})
	return button
}
