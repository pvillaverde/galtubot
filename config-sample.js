module.exports = {
	discord_bot_token: 'DISCORD_BOT_TOKEN', // Token do Bot de discord
	discord_channel_name: '🟥youtube-galego', // Nome da canle de Discord
	messageTemplate: 'Boas rapazada!\n\n**{author}** acaba de subir o vídeo **{title}**!\n{url}', // Mensaxe plantilla
	watchInterval: 15 * 60 * 1000, // Intervalo de refresco en ms
	useYoutubeAPI: false, // Se é true, ter coidado cos intervalos, unha vez o día recomendado para non pasar da cuota.
	google_spreadsheet: {
		id: '1f3N-0N8b2ZoYjlH86ktKGHcznF-PH27SsIj0M_xYUhk', // Id da folla de google
		range: 'Youtube!A2:C', // Táboa e rango de celdas
		headers: 'id,name,twitter', // Cabeceiras das columnas
	},
	google_credentials: {},
	/* twitter: {
		appKey: '',
		appSecret:'',
		accessToken: '',
		accessSecret: '',
		messageTemplate: '(🤖🤖Isto é unha proba dun bot, sorry 🤖🤖)\n\n{channelName} {twitterUser} acaba de publicar o vídeo "{title}" no Youtube. Dálle unha ollada en\n{url}',
	}, */
	
	/* mastodon: {
		access_token: '',
		timeout_ms: 60 * 100,
		api_url: 'https://botsin.space/api/v1/',
		messageTemplate: '🤖 {channelName} acaba de publicar o vídeo "{title}" no #GalegoTube #Youtubeiras. Dálle unha ollada en\n{url}',
	}, */
};
