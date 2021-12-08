function ThinPlayer(settings) {
	var self = this;
	var windowTitle = document.title;
	
	this.settings 	= settings;	
	this.el 		= new Audio();
	this.el.preload	= 'auto';
	
	this.duration 	= 0;
	this.time 		= 0;
	this.timeNow	= 0;
	this.metaLoaded = false;
	
	this.array		= false;
	this.arrayLength= 0;
	this.position	= 0;
	
	this.isPlaying = function() {
		return !self.el.paused;
	}
	
	this.timeBar = function() {
		if(!self.metaLoaded) setTimeout(self.timeBar, 500);
		else {
			self.duration 	= self.el.duration;
			self.time 		= self.duration * 1000;
			self.timeNow 	= self.el.currentTime * 1000;
				
			if(self.timeNow <= self.time) {
				var bar = getNode(settings.bindings.player.playBar);
				bar.style.width = (self.timeNow/self.time * 100) +'%';
				var timeOver = getNode(settings.bindings.player.time);
				timeOver.innerHTML = self.timeDivide();
				if(self.isPlaying()) setTimeout(self.timeBar, 1);
			}
		}
	}
	
	this.timeDivide = function() {
		var timeX 		= Math.floor(self.el.currentTime);
		var minutes 	= Math.floor(timeX/60);
		var seconds		= timeX-(minutes*60);
		if(seconds < 10) seconds = '0' + seconds;
		if(minutes < 10) minutes = '0' + minutes;
		return minutes + ':' + seconds;
	}
	
	this.changeState = function(state) {
		switch(state) {
			case 'play':
				document.title = '▶ ' + windowTitle;
				var play = getNode(settings.bindings.controls.play);
				if(elMatch(settings.bindings.controls.play) == 'id') {
					play.style.display = 'none';
				} else {
					applyToMany(play, '.style.display = "none"');
				}
				var pause = getNode(settings.bindings.controls.pause);
				if(elMatch(settings.bindings.controls.pause) == 'id') {
					pause.style.display = 'inline-block';
				} else {
					applyToMany(pause, '.style.display = "inline-block"');
				}
				self.el.play();
				self.timeBar();
				break;
			case 'pause':
				document.title = windowTitle;
				var play = getNode(settings.bindings.controls.play);
				play.style.display = 'inline-block';
				var pause = getNode(settings.bindings.controls.pause);
				pause.style.display = 'none';
			
				self.el.pause();
				self.timeBar();
				break;
			case 'stop':
				document.title = windowTitle;
				var play = getNode(settings.bindings.controls.play);
				play.style.display = 'inline-block';
				var pause = getNode(settings.bindings.controls.pause);
				pause.style.display = 'none';
			
				self.el.pause();
				self.el.currentTime = 0;
				self.timeBar();
				break;
			case 'next':
				self.el.pause();
				
				if(settings.playlist) {
					if(self.position+1 < self.arrayLength) {
						self.position++;
						self.src(getSrc());
						sendEvent();
					} else if(settings.repeat) {
						self.position = 0;
						self.src(getSrc());
						sendEvent();
					} else {
						self.position = 0;
						self.changeState('stop');
						self.src(getSrc(), false);
					}
				}
				break;
			case 'last':
				self.el.pause();
				
				if(settings.playlist) {
					if(self.position-1 >= 0) {
						self.position--;
						self.src(settings.src[self.position]);
						sendEvent();
					} else {
						self.position = self.arrayLength-1;
						self.src(settings.src[self.position], false);
						sendEvent();
						self.changeState('play');
					}
				}
				break;			
		}
	}
	
	this.src = function(srcX, changeSt) {
		if(typeof changeSt == 'undefined') changeSt = true;
		if(typeof srcX != 'undefined') {
			if(changeSt) self.changeState('stop');
			self.el.src = srcX;
			self.el.load();
			if(changeSt) self.changeState('play');
			setTimeout(self.timeBar, 200);
			return self.el.src;
		} else {
			return self.settings.src;
		}
	}
	
	if(settings.drag) {
		var seek = getNode(settings.bindings.player.seekBar);
		if(elMatch(settings.bindings.player.seekBar) == 'id') {
			/* Bind touch events */
			seek.addEventListener("touchstart", touchHandler, true);
			seek.addEventListener("touchmove", touchHandler, true);
			seek.addEventListener("touchend", touchHandler, true);
			seek.addEventListener("touchcancel", touchHandler, true);

			/* Bind mouse events */
			seek.addEventListener("mousedown", mouseDown, false);
			seek.addEventListener("mousedown", divMove, true);
		} else {
			applyToMany(seek, '.addEventListener("touchstart", touchHandler, true);');
			applyToMany(seek, '.addEventListener("touchmove", touchHandler, true);');
			applyToMany(seek, '.addEventListener("touchend", touchHandler, true);');
			applyToMany(seek, '.addEventListener("touchcancel", touchHandler, true);');
			applyToMany(seek, '.addEventListener("mousedown", mouseDown, false);');
			applyToMany(seek, '.addEventListener("mousedown", divMove, true);');
		}
		window.addEventListener('mouseup', mouseUp, false);
		
		/* Try to stop text select */
		var cont = getNode(settings.bindings.player.container);
		if(elMatch(settings.bindings.player.container) == 'id') {
			cont.onselectstart = function(e) {
				e.preventDefault();
			}
		} else {
			applyToMany(cont, '.onselectstart = function () {e.preventDefault();}');
		}
	}

	function mouseUp() {
		window.removeEventListener('mousemove', divMove, true);
	}

	function mouseDown(e) {
		window.addEventListener('mousemove', divMove, true);
	}
	
	function divMove(e) {
		var div = getNode(settings.bindings.player.playBar);
		var seek = getNode(settings.bindings.player.seekBar);

		var offset = parseInt(seek.offsetLeft);
		var maxwidth = (seek.offsetWidth);

		if(e.clientX+offset <= maxwidth+offset*2) {
			var perc = (e.clientX-offset)/(maxwidth/100);
			div.style.width = perc + '%';
			self.el.currentTime = (perc*self.duration)/100;
			self.timeBar();
		}
	}
	
	/* I did not write this method, try here: http://pastebin.com/z1B5jz7W */
	function touchHandler(event) {
		var touch = event.changedTouches[0];
	
		var simulatedEvent = document.createEvent("MouseEvent");
	
		simulatedEvent.initMouseEvent({
			touchstart: "mousedown",
			touchmove: "mousemove",
			touchend: "mouseup"
		}[event.type], true, true, window, 1,
			touch.screenX, touch.screenY,
			touch.clientX, touch.clientY, false,
			false, false, false, 0, null
		);
	
		touch.target.dispatchEvent(simulatedEvent);
		event.preventDefault();
	}
	
	function getNode(node) {
		var nodeTyp = elMatch(node);
		
		switch(nodeTyp) {
			case 'class' :
				node = node.replace('.', '');
				node = document.getElementsByClassName(node);
				break;
			case 'id' :
				node = node.replace('#', '');
				node = document.getElementById(node);
				break;
			case 'tag' :
				node = document.getElementsByTagName(node);
				break;
		}
		return node;
	}
			
	
	function loader() {
		var loadBar = getNode(settings.bindings.player.loadBar);
		loadBar.style.width = 0 + '%';
		try {
			var progress = Math.round((self.el.buffered.end(0) / self.duration) * 100);
		} catch(err) {
			//Do nothing!
		}
		if(progress == 100) {
			loadBar.style.width = 100+'%';
			setTimeout(function() {
				loadBar.style.opacity = 0;
			}, 1500);
		}
		else {
			loadBar.style.opacity = 1;
			loadBar.style.width = progress+'%';
		}
	}
	
	function elMatch(string) {
		if(string.indexOf('.') != -1) return 'class';
		else if(string.indexOf('#') != -1) return 'id';
		else return 'tag';
	}
	
	function isArray(elem) {
		if(elem instanceof Array) return true;
		else return false;
	}
	
	function listToArray(list) {
		var i, array = [];
		for  (i=0; i<list.length;i++) {array[i] = list[i];}
		return array;
	}
	
	function applyToMany(nodeLst, script) {
		for(var i = 0; i < nodeLst.length; i++) {
			eval('nodeLst[i]'+script);
		}
	}
	
	this.el.addEventListener('ended', function() {
		self.metaLoaded = false;
		self.changeState('stop');
		self.timeBar();
		if(settings.repeat && !settings.playlist) self.changeState('play');
		if(settings.playlist) {
			self.changeState('next');
		}
	}, false);
	this.el.addEventListener('loadedmetadata', function() {
		self.metaLoaded = true;
	}, false);
	this.el.addEventListener('progress', loader, false);
	
	window.addEventListener("keypress", function(e) {
		var keyCode = e.keyCode;
		if(keyCode == 32) {
			e.preventDefault();
			if(self.isPlaying()) self.changeState('pause');
			else self.changeState('play');
			return false;
		}
	}, false);
	
	function sendEvent() {
		var msg = getSrc();
	
		if(msg && window.CustomEvent) {
			var event = new CustomEvent("changesong", {
				detail: msg,
				bubbles: true,
				cancelable: true
			});
			document.dispatchEvent(event);
		}
	}
	
	function getSrc() {
		if(typeof settings.src[self.position] == 'object') {
			if(self.el.canPlayType('audio/mpeg')) {
			    return settings.src[self.position].mp3;
			} else {
			    return settings.src[self.position].ogg;
			}
		} else {
			return settings.src;
		}
	}
	
	function auto() {
		if(self.metaLoaded) {
			self.changeState('play');
			sendEvent();
		} else setTimeout(auto, 500);
	}
	
	function init() {
		if(self.metaLoaded) /*self.changeState('stop');*/ console.log();
		else setTimeout(init, 500);
	}
	
	if(isArray(settings.src)) {
		self.array = true;
	}
	if(self.array) {
		self.arrayLength = settings.src.length;		
		self.src(getSrc(),false)
		
	} else {
		self.src(settings.src, false);
	}

	if(settings.autoplay) auto();
	else init();
}