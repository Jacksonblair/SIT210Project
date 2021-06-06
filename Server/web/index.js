let recordKeys = false // flag to record combinations
let keyDict = {}

let E_mainInterface = null
let E_connectionStatus = {}
let E_allBindings = {}
let E_binding = {}
let E_pairing = {}

let MESSAGES = {
	NO_CONNECTION: "No connection",
	CONNECTED_TO_BY: "Connected to by:"
}

window.onload = async () => {

	// Get key dictionary from python
	keyDict = await eel.getKeyDict()()

	E_mainInterface = document.getElementById("main-interface")

	E_connectionStatus.Parent = document.getElementById('connection-status')
	E_connectionStatus.Message = document.getElementById('connection-status-message')
	E_connectionStatus.DisconnectButton = document.getElementById('connection-status-disconnect-button')
	E_connectionStatus.EditBindingsButton = document.getElementById('connection-status-edit-bindings-button')

	E_allBindings.Parent = document.getElementById('all-bindings')
	E_allBindings.Container = document.getElementById('all-bindings-container')
	E_allBindings.BackButton = document.getElementById('all-bindings-back-button')

	E_binding.Parent = document.getElementById('binding')
	E_binding.Message = document.getElementById('binding-message')
	E_binding.Input = document.getElementById('binding-input')
	E_binding.SaveButton = document.getElementById('binding-save-button')
	E_binding.ExitButton = document.getElementById('binding-exit-button')

	E_pairing.Parent = document.getElementById('pairing')
	E_pairing.Message = document.getElementById('pairing-message')

	E_mainInterface.innerHTML = ""

	// Initialize UI here
	showNotConnectedStatus()

}


let combination = "" // hold combination value to save
let keyListener = (event) => {
	if (recordKeys) {
		// Stop keypress from affecting browser window
		event.preventDefault()
		clear(E_binding.Input)
		// If key is included in our dictionary
		if (keyDict[event.code]) {
			// If pressing ctrl or alt or shift, we want to add to our combination.
			if (event.ctrlKey || event.shiftKey || event.altKey) {
				if ((event.ctrlKey && keyDict[event.code] !== 'ctrl')
				|| (event.shiftKey && keyDict[event.code] !== 'shift')
				|| (event.altKey && keyDict[event.code] !== 'alt')) {
					combination = `${combination}+${keyDict[event.code]}`
				} else {
					combination = keyDict[event.code]
				}
			// Else we just write a single keypress
			} else {
				combination = keyDict[event.code]
			}

			if (!combination) combination = "None"

			generateCombinationElement(combination)			

		} else {
			console.log("DONT HAVE IT")
		}


	}
}

document.addEventListener('keydown', keyListener)

async function connectToPeripheral() {
	setMainInterface(E_pairing)
	let result = await eel.connectToPeripheral()()
	showConnectionStatus()
}

async function showBindings() {
	console.log("Getting bindings...")
	let bindings = await eel.getBindings()()
	console.log("Got bindings")
	console.log(bindings)
	// Populate E_allBindings.Parent with binding elements
	generateBindingElements(bindings)
	setMainInterface(E_allBindings)
}

eel.expose(notifyConnection)
function notifyConnection() {
	showConnectionStatus()
}	

eel.expose(notifyDisconnection)
function notifyDisconnection() {
	showConnectionStatus()
}

async function disconnect() {
	let result = await eel.disconnect()()
	showConnectionStatus()
}

async function showConnectionStatus() {
	let connection = await eel.getConnection()()
	console.log(connection)
	if (connection) {
		showConnectedStatus(connection)
	} else {
		showNotConnectedStatus()
	}
}

function showConnectedStatus(connection) {
	console.log(connection)
	set(E_connectionStatus.Message, `${MESSAGES.CONNECTED_TO_BY} ${connection[0]}`)
	E_connectionStatus.DisconnectButton.classList = "show"
	setMainInterface(E_connectionStatus)
}

function showNotConnectedStatus() {
	set(E_connectionStatus.Message, MESSAGES.NO_CONNECTION)
	E_connectionStatus.DisconnectButton.classList = "hide"
	setMainInterface(E_connectionStatus)
}

/* Setting connection interface elements */
function setMainInterface(interface) {
	set(E_mainInterface, "") // Clear interface contents
	E_mainInterface.appendChild(interface.Parent) // Replace with passed interface arg
}

function generateBindingElements(bindings) {
	// Remove all previous nodes
	clear(E_allBindings.Container)

	bindings.forEach((binding, i) => {
		console.log(i)
		let element = document.createElement('button')
		element.innerHTML = `Binding ${i + 1}: ${binding ? binding : "None"}`
		element.classList = "binding"
		element.addEventListener('click', () => {
			showBinding(i, binding)
		})
		E_allBindings.Container.appendChild(element)
	}) 
}

function generateCombinationElement(string) {
	let element = document.createElement('div')
	element.innerHTML = string
	element.classList = "combination"
	E_binding.Input.appendChild(element)
}

async function showBinding(index, previousValue) {
	recordKeys = true

	// Remove previous combination elements
	clear(E_binding.Input)

	// Pre-fill 'input' with previous binding
	// Split combinations .. (keys that are pressed in sequence without releasing previous key)
	// .. by commas.
	let combinations = previousValue.split(',')
	combinations.forEach((combination) => {
		generateCombinationElement(combination)
	})

	E_binding.Input._index = index
	E_binding.Message = `Binding ${index}`

	setMainInterface(E_binding)
}

function exitBinding() {
	recordKeys = false
	showBindings()
}

function saveBinding() {
	recordKeys = false

	let result = eel.setBinding(combination, E_binding.Input._index)
	if (result) {
		showBindings()
	}

	// console.log("Value", E_binding.Dropdown.value)
	// console.log("Index", E_binding.Dropdown._buttonIndex)
	// let result = eel.setBinding(E_binding.Dropdown.value, E_binding.Dropdown._buttonIndex)()
	// if (result) {
	// 	showBindings()
	// } else {
	// 	// TODO: REPLACE THIS
	// 	console.log("saving the binding went wrong")
	// }
}

function clear(el) {
	el.innerHTML = ""
}

function set(el, val) {
	el.innerHTML = val
}
