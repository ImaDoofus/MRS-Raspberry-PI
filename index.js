const express = require('express');
const app = express();
const session = require('express-session');
const sessionOptions = {
	secret: 'keyboard cat',
	cookie: {
		maxAge:269999999999
	},
	saveUninitialized: true,
	resave:true
}
const http = require('http');
const server = http.createServer(app)
const { Server } = require('socket.io');
const io = new Server(server);

const wol = require('wake_on_lan');

const port = 3000
const password = '123456'
const macAddress = 'A6-00-48-CA-D0-35'
const ipAddress = '192.168.1.8'

var computerStatus = 'offline'
var computerSocket = null
var cachedServerList = [];
var cachedServerStatuses = [];
var cachedServerConsoles = [];

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(session(sessionOptions))
app.use(express.static('public'))

app.get('/', (req, res) => {
	res.status(200).render('login/index.ejs')
})

app.post('/', (req, res) => {
	var passwordGiven = req.body.password;
	if (passwordGiven === password) {
		req.session.password = passwordGiven
		res.redirect('start')
	} else {
		res.render('login/index.ejs', { password: passwordGiven, failed: true } )
	}
})

app.get('/start', (req, res) => {
	if (req.session.password === password) {
		res.render('start/index.ejs', { password: password })
	} else {
		res.redirect('/')
	}
})

io.on('connection', (socket) => {

	socket.emit('computerStatus', computerStatus)
	socket.emit('serverList', cachedServerList)
	cachedServerStatuses.forEach((cachedServerStatus) => {
		socket.emit('serverStatus', cachedServerStatus)
	})
	cachedServerConsoles.forEach((cachedServerConsole) => {
		socket.emit('consoleStatus', cachedServerConsole)
	})

	socket.on('auth', (data) => {
		if (data.password === password) {
			socket.password = password
		}
	})

	socket.on('startPC', (data) => {
		if (socket.password === password) {
			console.log('startPC')
			wol.wake(macAddress, { address: ipAddress }, function(error) {
				if (error) {
					console.log('error: ' + error);
				} else {
					console.log('Magic packet sent to ' + macAddress);
				}
			})
			computerStatus = 'starting'
			socket.broadcast.emit('computerStatus', computerStatus )
			// setTimeout(() => {
				// computerStatus = 'online'
				// io.emit('computerStatus', computerStatus )
				// let serverList = [{ name: 'Example Server 1', ip: 'personman.net:80' }, { name: 'Example Server 2', ip: 'personman.net:81' }]
				// socket.emit('serverList', serverList)
			// }, 2000)
		}
	})

	socket.on('serverList', (serverList) => {
		computerStatus = 'online'
		computerSocket = socket
		cachedServerList = serverList
		socket.broadcast.emit('computerStatus', computerStatus )
		socket.broadcast.emit('serverList', serverList)
	})

	socket.on('startServer', (name) => {
		if (socket.password === password) {
			if (computerSocket) {
				computerSocket.emit('startServer', name)
			}
		}
	})

	socket.on('runCommand', (data) => {
		if (socket.password === password) {
			if (computerSocket) {
				console.log('runCommand', data)
				computerSocket.emit('runCommand', data)
			}
		}
	})

	socket.on('serverStatus', (data) => {
		socket.broadcast.emit('serverStatus', data)
		for(var i = 0; i < cachedServerStatuses.length; i++) {
			if (cachedServerStatuses[i].name === data.name) {
				cachedServerStatuses[i] = data
				return
			}
		}
		cachedServerStatuses.push(data)
	})

	socket.on('consoleOutput', (data) => {
		socket.broadcast.emit('consoleOutput', data)
		for (var i = 0; i < cachedServerConsoles.length; i++) {
			var cachedServerConsole = cachedServerConsoles[i]
			if (cachedServerConsole.server === data.server) { // if cached add to console
				cachedServerConsole.lines.push(data.output)
				return
			}
		}

		// otherwise add a cache
		cachedServerConsoles.push({ server: data.server, lines: [data.output] })

	})

	socket.on('disconnect', () => {
		if (socket === computerSocket) {
			cachedServerStatuses = []
			cachedServerList = []
			cachedServerConsoles = []
			computerStatus = 'offline'
			socket.broadcast.emit('computerStatus', computerStatus )
		}
	})

	socket.on('serverStopped', (name) => {
		if (socket === computerSocket) {
			for(var i = 0; i < cachedServerStatuses.length; i++) {
				if (cachedServerStatuses[i].server === name) {
					cachedServerStatuses.splice(i, 1)
				}
			}
			for(var i = 0; i < cachedServerConsoles.length; i++) {
				if (cachedServerConsoles[i].server === name) {
					cachedServerConsoles.splice(i, 1)
				}
			}		
			io.emit('serverStopped', name)
		}
	})
})

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
})