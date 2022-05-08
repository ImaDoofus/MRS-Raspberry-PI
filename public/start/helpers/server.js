class Server {
	constructor(options) {
		this.name = options.name;
		this.ip = options.ip;
		this.port = options.port;
		this.status = options.status || 'offline';
		this.favicon = options.favicon || 'assets/pack.png';
		this.playerCount = options.playerCount || 0;
		this.maxPlayers = options.maxPlayers || 0;
		this.description = options.description || 'No description available.';

		this.dynmap = options.dynmap || false;

		this.console = document.createElement('div');
		this.console.classList.add('console-output');
		this.element = document.createElement('div');
		this.element.classList.add('server-list-item');
	}

	update() {
		let wrapper = this.element;
		while (wrapper.children.length > 0) {
			wrapper.children[0].remove();
		}

		let infoWrapper = document.createElement('div');
		infoWrapper.classList.add('server-info-wrapper');

		let serverTitle = document.createElement('div');
		serverTitle.classList.add('server-list-title');

		let name = document.createElement('div');
		name.classList.add('server-list-item-name');
		name.innerText = this.name;

		let status = document.createElement('div');
		status.classList.add('server-list-item-status');

		let playerCount = document.createElement('div');
		playerCount.innerText = this.playerCount+'/'+this.maxPlayers;
		playerCount.classList.add('server-list-item-player-count');

		let serverDescription = document.createElement('div');
		serverDescription.classList.add('server-list-item-description');
		serverDescription.innerText = this.description;

		switch (this.status) {
			case 'online':
				status.innerText = 'Online';
				status.style.color = '#00ff00';
				break;
			case 'offline':
				status.innerText = 'Offline';
				status.style.color = '#ff0000';
				break;
			case 'starting':
				status.innerText = 'Starting...\nPlease allow some time to start.';
				status.style.color = '#ffff00';
				break;
		}

		serverTitle.appendChild(name);
		serverTitle.appendChild(status);

		let serverIcon = document.createElement('img');
		serverIcon.src = this.favicon;
		serverIcon.classList.add('server-list-item-icon');

		let ip = document.createElement('div');
		ip.classList.add('server-list-item-ip');
		ip.innerText = 'IP: '+this.ip+':'+this.port;
		
		let serverButtons = document.createElement('div');
		serverButtons.classList.add('server-list-item-buttons');

		let startButton = document.createElement('button');
		startButton.innerText = 'Start';
		startButton.classList.add('server-list-item-start-button');
		startButton.addEventListener('click', () => {
			this.startServer();
		});

		let openConsoleButton = document.createElement('button');
		openConsoleButton.innerText = 'Open Console';
		openConsoleButton.classList.add('server-list-item-open-console-button');
		openConsoleButton.addEventListener('click', () => {
			openServerConsole(this);
		});

		let openDynmapButton = document.createElement('button');
		openDynmapButton.innerText = 'Open Dynmap';
		openDynmapButton.classList.add('server-list-item-open-dynmap-button');
		openDynmapButton.addEventListener('click', () => {
			openServerDynmap(this);
		});

		infoWrapper.appendChild(serverTitle);
		wrapper.appendChild(serverIcon);
		wrapper.appendChild(infoWrapper);
		wrapper.appendChild(serverButtons);
		switch (this.status) {
			case 'online':
				infoWrapper.appendChild(playerCount);
				infoWrapper.appendChild(serverDescription);
				serverButtons.appendChild(openConsoleButton);
				if (this.dynmap) {
					serverButtons.appendChild(openDynmapButton);
				}
				break;
			case 'offline':
				serverButtons.appendChild(startButton);
				break;
		}				
		return wrapper;
	}
}