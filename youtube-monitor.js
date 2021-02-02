const config = require('./config.json');
const TwitchApi = require('./twitch-api');
const MiniDb = require('./minidb');
const moment = require('moment');
const GoogleSheetsApi = require('./google-sheets');

class YoutubeMonitor {
	static __init() {
		this.MIN_POLL_INTERVAL_MS = 30000;

		this._lastUserRefresh = null;
		this._pendingUserRefresh = false;
	}

	static start() {
		// Load channel names from config
		this.getChannels().then((channels) => {
			this.channels = channels;

			// Configure polling interval
			let checkIntervalMs = parseInt(config.watchInterval);
			if (isNaN(checkIntervalMs) || checkIntervalMs < this.MIN_POLL_INTERVAL_MS) {
				// Enforce minimum poll interval to help avoid rate limits
				checkIntervalMs = this.MIN_POLL_INTERVAL_MS;
			}
			setInterval(() => {
				this.refresh('Periodic refresh');
			}, checkIntervalMs + 1000);

			// Immediate refresh after startup
			setTimeout(() => {
				this.refresh('Initial refresh after start-up');
			}, 1000);

			// Ready!
			console.log(
				'[YoutubeMonitor]',
				`Configured stream status polling for channels:`,
				this.channels.join(', '),
				`(${checkIntervalMs}ms interval)`
			);
		});
	}

	static getChannels() {
		return GoogleSheetsApi.fetchData(config.google_spreadsheet)
			.then((channelsValues) => {
				const channels = [];
				const keys = config.google_spreadsheet.headers.split(',');
				channelsValues.forEach((values) => {
					const channel = {};
					for (let index = 0; index < keys.length; index++) {
						channel[keys[index]] = this.sanitizeField(values[index]);
					}
					channels.push(channel);
				});
				if (!channels.length) {
					throw console.warn('[YoutubeMonitor]', 'No channels configured');
				}
				return channels;
			})
			.catch((error) => {
				console.error('[YoutubeMonitor]', 'Non se puideron actualizar as canles', error);
				return this.channels;
			});
	}

	static sanitizeField(field) {
		return field.toLowerCase().replace('\r\n', '').replace('\r', '').replace('\n', '');
	}

	static refresh(reason) {
		const now = moment();
		console.log('[Youtube]', ' ▪ ▪ ▪ ▪ ▪ ', `Refreshing now (${reason ? reason : 'No reason'})`, ' ▪ ▪ ▪ ▪ ▪ ');

		// Refresh all users periodically
		if (this._lastUserRefresh === null || now.diff(moment(this._lastUserRefresh), 'minutes') >= 10) {
			this._pendingUserRefresh = true;

			this.getChannelNames().then((channels) => {
				this._lastUserRefresh = moment();
				this.channels = channels;
				this.refresh('Actualizadas as canles, recuperando os vídeos.');
				if (this._pendingUserRefresh) {
					this._pendingUserRefresh = false;
					this.refresh('Got Twitch users, need to get streams');
				}
			});
		}

		// Refresh all games if needed
		if (!this._pendingUserRefresh) {
			this.channels.forEach((channel) => this.checkChannelVideos(channel));
		}
	}

	static checkChannelVideos(channel) {
		if (DATABASE.fetch(`postedVideos.${channel}`) === null) DATABASE.set(`postedVideos.${channel}`, []);
		rssParser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${config.channel_id}`).then((data) => {
			if (DATABASE.fetch(`postedVideos.${channel}`).includes(data.items[0].link)) return;
			else {
				DATABASE.set(`videoData.${channel}`, data.items[0]);
				DATABASE.push(`postedVideos.${channel}`, data.items[0].link);
				let parsed = DATABASE.fetch(`videoData.${channel}`);
				let channel = client.channels.cache.get(config.channel);
				if (!channel) return;
				let message = config.messageTemplate
					.replace(/{author}/g, parsed.author)
					.replace(/{title}/g, Discord.Util.escapeMarkdown(parsed.title))
					.replace(/{url}/g, parsed.link);
				channel.send(message);
			}
		});
	}
}

module.exports = YoutubeMonitor;

YoutubeMonitor.__init();
