import config as globals

# Other files
import comms
import interface

# Client.py starts the application and the main loop
globals.eel.init('web')
globals.eel.start('index.html', mode='chrome', size=(400, 400), cmdline_args=['--start-fullscreen'])