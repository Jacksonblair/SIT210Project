import bluetooth
import config as globals
import keyboard

def parseInput(data):
    bindings = globals.getBindings()    
    if str(bindings[data - 1]) != "":
        print(bindings[data - 1])
        keyboard.send(str(bindings[data - 1]))
    else:
        print("Error: No macro for this button")

def startSocket():
    # Start listening on RFCOMM socket
    server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
    server_sock.bind(("", bluetooth.PORT_ANY))
    server_sock.listen(1)

    port = server_sock.getsockname()[1]

    uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"

    bluetooth.advertise_service(server_sock, "SampleServer", service_id=uuid,
                                service_classes=[uuid, bluetooth.SERIAL_PORT_CLASS],
                                profiles=[bluetooth.SERIAL_PORT_PROFILE],
                                # protocols=[bluetooth.OBEX_UUID]
                                )

    connected = False

    while True:
        if not connected:
            print("Waiting for connection on RFCOMM channel", port)
            globals.client_sock, client_info = server_sock.accept()
            print("Accepted connection from", client_info)
            connected = True
            globals.currentConnection = client_info
            print(client_info)
            globals.eel.notifyConnection()
        else:
            try:
                while True:
                    data = globals.client_sock.recv(1024)

                    if not data:
                        connected = False
                        globals.currentConnection = None
                        globals.eel.notifyDisconnection()
                        globals.client_sock.close()
                        print("Disconnected.")

                    print("Received", data)
                    parseInput(len(data))
            except OSError:
                connected = False
                globals.currentConnection = None
                globals.eel.notifyDisconnection()
                print("Socket closed")

    server_sock.close()
    print("All done.")
