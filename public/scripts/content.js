const YTB = {
	observerElements: {},

	waitElement: (selector) => {
		return new Promise((resolve) => {
			if ((element = (document?.body || document).querySelector(selector))) return resolve(element);

			YTB.observerElements[selector] = new MutationObserver((mutations, observer) => {
				if ((element = (document?.body || document).querySelector(selector))) {
					observer.disconnect();
					delete YTB.observerElements[selector];

					return resolve(element);
				}
			}).observe(document.body || document.documentElement || document, {
				childList: true,
				subtree: true,
			});
		});
	},

	regex: /(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/gs,

	getYouTubeId: (url) => {
		const arr = url.split(YTB.regex);
		return undefined !== arr[2] ? arr[2].split(/[^\w-]/i)[0] : arr[0];
	},

	menuItems: {},

	addMenuItem: (container, text, callback) => {
		if (YTB.menuItems[text]) return;
		YTB.menuItems[text] = true;

		const item = document.createElement('div');

		item.setAttribute('class', 'ytp-menuitem');
		item.setAttribute('aria-haspopup', 'false');
		item.setAttribute('role', 'menuitem');
		item.setAttribute('tabindex', '0');
		item.setAttribute('id', 'ytb-menu-item');

		item.innerHTML = '<div class="ytp-menuitem-icon"></div>';
		item.innerHTML += `<div class="ytp-menuitem-label">${text}</div>`;
		item.innerHTML += '<div class="ytp-menuitem-content"></div>';

		item.onclick = callback;
		container?.prepend(item);
	},
};

document.addEventListener('yt-navigate-finish', (ev) => {
	if (/\/watch/s.test(location.pathname) === false) return;

	YTB.waitElement('div.html5-video-player').then((element) => {
		YTB.videoElement = element.firstChild;

		const videoId = YTB.getYouTubeId(element.baseURI);

		chrome.storage.sync.get(videoId).then((result) => {
			if (Object.keys(result).length === 0) return;

			const item = result[videoId];
			const player = YTB.videoElement.firstChild;

			setTimeout(() => {
				player.pause();
				player.currentTime = Math.min(item.duration, item.currentTime);
			}, 200);
		});
	});

	YTB.waitElement('div.ytp-popup.ytp-contextmenu').then((element) => {
		YTB.addMenuItem(element.firstChild.firstChild, 'Запомнить время', (ev) => {
			ev.stopPropagation();
			ev.preventDefault();

			element.style.display = 'none';

			const video = YTB.videoElement;

			if (video && video.baseURI) {
				const player = video.firstChild;

				if (player) {
					const videoId = YTB.getYouTubeId(video.baseURI);
					const videoTitle = document.querySelector('h1.style-scope.ytd-watch-metadata');

					// await?
					chrome.storage.sync.set({
						[videoId]: {
							title: videoTitle?.innerText ?? videoId,
							currentTime: player.currentTime,
							duration: player.duration,
							date: Date.now(),
						},
					});
				}
			}
		});
	});
});

document.addEventListener('unload', () => {
	for (const key in YTB.observerElements) YTB.observerElements[key]?.disconnect();
});
