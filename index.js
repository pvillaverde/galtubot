#!/usr/bin/env node
const DATABASE = require('quick.db');
const Discord = require('discord.js');
const client = new Discord.Client();
const rssParser = new (require('rss-parser'))();
const sequential = require('promise-sequential');
const config = require('./config.js');
const moment = require('moment');
const GoogleApi = require('./google-api');
const DiscordChannelSync = require('./discord-channel-sync');
const { TwitterApi } = require('twitter-api-v2');
const FileDatabaseService = require('./fileDatabase.service.js');

let discordTargetChannels = [];
let syncServerList = (logMembership) => {
	discordTargetChannels = DiscordChannelSync.getChannelList(client, config.discord_channel_name, logMembership);
};

client.on('ready', () => {
	console.log('[Discord]', `BoT listo, iniciou sesión como ${client.user.tag}.`);

	// Init list of connected servers, and determine which channels we are announcing to
	syncServerList(true);
	// Begin Twitch monitoring
	YoutubeMonitor.start();
});

client.on('guildCreate', async (guild) => {
	console.log(`[Discord]`, `Joined new server: ${guild.name}`);
	let newChannel = guild.channels.cache.find((g) => g.name === config.discord_channel_name);
	if (!newChannel) {
		console.log(`[Discord]`, `Channel not found on new server: ${guild.name}`);
	} else {
		try {
			await newChannel.send('Configuración lista! En canto haxa novos vídeos enviarei as notificacións nesta canle!');
		} catch (error) {
			guild.owner.user.send('Ocurriu un erro ao configurar o bot, revisa que ten os permisos para escribir na canle.');
		}
	}

	syncServerList(false);
});

client.on('guildDelete', (guild) => {
	console.log(`[Discord]`, `Removed from a server: ${guild.name}`);

	syncServerList(false);
});

class YoutubeMonitor {
	static __init() {
		this.MIN_POLL_INTERVAL_MS = 30000;

		this._lastUserRefresh = null;
		this._pendingUserRefresh = false;
		this.queries = 0;
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
		return GoogleApi.fetchSpreadsheetData(config.google_spreadsheet)
			.then((channels) => {
				if (!channels.length) {
					throw console.warn('[YoutubeMonitor]', 'Non se atoparon canles');
				}
				return channels;
			})
			.catch((error) => {
				console.error('[YoutubeMonitor]', 'Non se puideron actualizar as canles', error);
				new FileDatabaseService('live-messages').put('last-error', moment());
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

		// Refresh all videos if needed
		if (!this._pendingUserRefresh) {
			this.queries = 0;
			const promises = this.channels.map((channel) => () => this.checkChannelVideos(channel));
			sequential(promises).then((res) => console.log('[YoutubeMonitor] Actualizaronse todas.'));
		}
	}

	static checkChannelVideos(channel) {
		if (DATABASE.fetch(channel.id) === null) DATABASE.set(channel.id, []);
		this.queries++;
		if (config.useYoutubeAPI) {
			this.checkChannelVideosByAPI(channel);
		} else {
			this.checkChannelVideosByRSS(channel);
		}
	}
	static checkChannelVideosByRSS(channel) {
		return rssParser
			.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`)
			.then((data) => {
				const lastVideoData = data.items[0];
				if (!lastVideoData) throw 'Non hai ningún vídeo.';
				if (DATABASE.fetch(channel.id).includes(lastVideoData.link)) return;
				else {
					DATABASE.push(channel.id, lastVideoData.link);
					let message = config.messageTemplate
						.replace(/{author}/g, lastVideoData.author)
						.replace(/{title}/g, Discord.Util.escapeMarkdown(lastVideoData.title))
						.replace(/{url}/g, lastVideoData.link);
					this.sendTweet(channel,lastVideoData.title, lastVideoData.link);
					discordTargetChannels.forEach((discordChannel) => {
						if (!discordChannel) return;
						discordChannel.send(message);
					});
				}
			})
			.catch((error) => {
				if (error.stack && error.stack.match(/404/)) {
					console.error('[YoutubeMonitor]', `Non se puido actualizar a canle ${channel.name} - ${channel.id}`);
				} else {
					console.error('[YoutubeMonitor]', `Non se puido actualizar a canle ${channel.name}`, error);
				}
				new FileDatabaseService('live-messages').put('last-error', moment());
			});
	}
	static checkChannelVideosByAPI(channel) {
		return GoogleApi.fetchLatestVideos(channel.id)
			.then((response) => {
				if (!response.data.items || !response.data.items.length) throw 'Non hai ningún vídeo';
				response.data.items.forEach((video) => {
					const link = `https://www.youtube.com/watch?v=${video.id.videoId}`;
					if (DATABASE.fetch(channel.id).includes(link)) return;
					if (video.snippet.liveBroadcastContent != 'none') return; // video ainda non publicado (estreas, directos)
					DATABASE.push(channel.id, link);
					let message = config.messageTemplate
						.replace(/{author}/g, video.snippet.channelTitle)
						.replace(/{title}/g, Discord.Util.escapeMarkdown(video.snippet.title))
						.replace(/{url}/g, link);
					this.sendTweet(channel, video.snippet.title, link);
					discordTargetChannels.forEach((discordChannel) => {
						if (!discordChannel) return;
						discordChannel.send(message);
					});
				});
			})
			.catch((error) => {
				if (error.stack && error.stack.match(/404/)) {
					console.error('[YoutubeMonitor]', `Non se puido actualizar a canle ${channel.name} - ${channel.id}`);
				} else {
					console.error('[YoutubeMonitor]', `Non se puido actualizar a canle ${channel.name}`, error);
				}
				new FileDatabaseService('live-messages').put('last-error', moment());
			});
	}
	static async sendTweet(channel, videoTitle, videoLink) {
		if (!config.twitter) return;
		const client = new TwitterApi({
			appKey: config.twitter.appKey,
			appSecret: config.twitter.appSecret,
			accessToken: config.twitter.accessToken,
			accessSecret: config.twitter.accessSecret,
		});
		let message = config.twitter.messageTemplate
			.replace(/{channelName}/g, channel.name)
			.replace(/{twitterUser}/g, channel.twitter && channel.twitter.startsWith('@') ? `(${channel.twitter})` : '')
			.replace(/{title}/g, Discord.Util.escapeMarkdown(videoTitle))
			.replace(/{url}/g, videoLink);
		try {
			var success = await client.v2.tweet(message);
			console.log('[YoutubeMonitor-Twitter]', `Enviouse actualización a twitter da canle: ${channel.name}`);
		} catch (error) {
			new FileDatabaseService('live-messages').put('last-error', moment());
			console.error('[YoutubeMonitor-Twitter]', `Non se puido enviar o tweet da canle ${channel.name}`, error);
		}
	}
}

YoutubeMonitor.__init();

console.log('[Discord]', 'Iniciando sesión...');
client.login(config.discord_bot_token);
