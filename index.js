#!/usr/bin/env node
const DATABASE = require('quick.db');
const Discord = require('discord.js');
const client = new Discord.Client();
const rssParser = new (require('rss-parser'))();
const config = require('./config.js');
const moment = require('moment');
const GoogleSheetsApi = require('./google-sheets');
const DiscordChannelSync = require('./discord-channel-sync');

client.on('ready', () => {
	console.log('[Discord]', `BoT listo, iniciou sesión como ${client.user.tag}.`);

	YoutubeMonitor.start();
});

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
			this._lastUserRefresh = moment();

			// Configure polling interval
			let checkIntervalMs = parseInt(config.watchInterval);
			if (isNaN(checkIntervalMs) || checkIntervalMs < this.MIN_POLL_INTERVAL_MS) {
				// Enforce minimum poll interval to help avoid rate limits
				checkIntervalMs = this.MIN_POLL_INTERVAL_MS;
			}

			this.targetChannels = DiscordChannelSync.getChannelList(client, config.discord_channel_name, false);

			setInterval(() => {
				this.refresh('Actualización periódica');
			}, checkIntervalMs + 1000);

			// Immediate refresh after startup
			setTimeout(() => {
				this.refresh('Actualización inicial despois do arranque');
			}, 1000);

			// Ready!
			console.log(
				'[YoutubeMonitor]',
				`Configurada a monitorización das seguintes canles:`,
				this.channels.map((c) => c.name).join(', '),
				`(${checkIntervalMs}ms de intervalo)`
			);
		});
	}

	static getChannels() {
		return GoogleSheetsApi.fetchData(config.google_spreadsheet)
			.then((channels) => {
				if (!channels.length) {
					throw console.warn('[YoutubeMonitor]', 'Non se atoparon canles');
				}
				return channels;
			})
			.catch((error) => {
				console.error('[YoutubeMonitor]', 'Non se puideron actualizar as canles', error);
				return this.channels;
			});
	}

	static refresh(reason) {
		const now = moment();
		console.log('[Youtube]', ' ▪ ▪ ▪ ▪ ▪ ', `Actualizando (${reason ? reason : 'No reason'})`, ' ▪ ▪ ▪ ▪ ▪ ');

		// Refresh all users periodically
		if (this._lastUserRefresh === null || now.diff(moment(this._lastUserRefresh), 'minutes') >= 60) {
			this._pendingUserRefresh = true;

			this.getChannels().then((channels) => {
				this._lastUserRefresh = moment();
				this.channels = channels;
				if (this._pendingUserRefresh) {
					this._pendingUserRefresh = false;
					this.refresh('Actualizadas as canles, recuperando os vídeos.');
				}
			});
		}

		// Refresh all games if needed
		if (!this._pendingUserRefresh) {
			this.channels.forEach((channel) => this.checkChannelVideos(channel));
		}
	}

	static checkChannelVideos(channel) {
		if (DATABASE.fetch(channel.id) === null) DATABASE.set(channel.id, []);
		rssParser
			.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`)
			.then((data) => {
				if (DATABASE.fetch(channel.id).includes(data.items[0].link)) return;
				else {
					const lastVideoData = data.items[0];
					DATABASE.push(channel.id, data.items[0].link);
					let message = config.messageTemplate
						.replace(/{author}/g, lastVideoData.author)
						.replace(/{title}/g, Discord.Util.escapeMarkdown(lastVideoData.title))
						.replace(/{url}/g, lastVideoData.link);
					this.targetChannels.forEach((discordChannel) => {
						if (!discordChannel) return;
						discordChannel.send(message);
					});
				}
			})
			.catch((error) => {
				console.error('[YoutubeMonitor]', `Non se puideron actualizar a canle ${channel.name}`, error);
			});
	}
}

YoutubeMonitor.__init();

console.log('[Discord]', 'Iniciando sesión...');
client.login(config.discord_bot_token);
