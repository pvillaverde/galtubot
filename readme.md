# Galtubot

🤖 **Un robot sinxelo para o discord que anuncia os vídeos da comunidade de Youtube en galego.**

![Galtubot As Canles de YT](https://i.imgur.com/EcH4j7X.png)

## Táboa de contidos

   * [Galtubot](#galtubot)
      * [Táboa de contidos](#táboa-de-contidos)
      * [Características](#características)
      * [Cómo uso o robot?](#cómo-uso-o-robot)
      * [Instalación e configuración](#instalación-e-configuración)
         * [Prerequisitos](#prerequisitos)
         * [Instalación](#instalación)
         * [Conseguindo os tokens requeridos](#conseguindo-os-tokens-requeridos)
            * [Aplicación do Bot de discord](#aplicación-do-bot-de-discord)
         * [Google Sheets API](#google-sheets-api)
         * [Configuración](#configuración)
         * [Arrincando galtubot](#arrincando-galtubot)
         * [Configurar galtubot como servizo](#configurar-galtubot-como-servizo)
         * [Configurar Galtubot como docker](#configurar-galtubot-como-docker)
         * [Invitando o teu galtubot](#invitando-o-teu-galtubot)
      * [Problemas coñecidos](#problemas-coñecidos)
      * [Creditos](#creditos)

Created by [gh-md-toc](https://github.com/ekalinin/github-markdown-toc)

## Características

- 📢 Comproba periódicamente as canles de Youtube indicadas nun arquivo de Google Drive e envía notificacións nunha canle de Discord.

## Cómo uso o robot?

Tes dúas opcións:

1. Podes [invitar ó bot "As Canles do YT"](https://discord.com/oauth2/authorize?client_id=805443544138907689&scope=bot) ó teu servidor de discord para recibir as notificacións da comunidade de Youtube en Galego (Tes que ter unha canle no servidor co nome `🟥youtube-galego`). Este bot utiliza a lista de canles recopilada por Fran, de [A Lobeira Today](https://www.youtube.com/channel/UCZZTH6dVk9k_ah6OpZ-w7ZA). Se botas en falta os vídeos novos dalgunha canle, ponte en contacto conmigo ou con Fran para engadila á lista.

2. Ou, podes facer unha copia propia seguindo as instruccións de abaixo e personalizalo como che apeteza.

## Instalación e configuración

### Prerequisitos

Este bot está feito en Node.js. Se non tes Node instalado, descárgao e instala a última versión LTS dende a páxina oficial para a plataforma na que o vaias executar:

https://nodejs.org/en/download/

**Recoméndase Node v10+.**

### Instalación

Para configurar Timbot, o xeito máis sinxelo e clonar o repositorio utilizando `git`:

    git clone https://github.com/pvillaverde/galtubot/

Unha vez instalado, entra no directorio e instala as dependencias:

    cd galtubot
    npm install

### Conseguindo os tokens requeridos

Terás que configurar algunhas aplicacións externas:

#### Aplicación do Bot de discord

O teu bot de discord precisa rexistrarse coma unha aplicación, e precisarás configurar o seu token (`discord_bot_token` na configuración de Timbot).

Segue [esta guía (en inglés)](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token) para máis información.

### Google Sheets API

O robot pódese configurar para que recolle os datos dunha folla de Excel, de tal xeito que cada 60 minutos refresca a lista de canles. Se están configurados os datos de Google Sheets, tratará de coller os datos da folla de cálculo. Asegúrate de ter unha columna coa ID da canle. A Columna de "name" só é relevante para depurar que se están engadindo correctamente as novas canles.

Para obter os datos segue a [Guía Rápida da API de Google Sheets](https://developers.google.com/sheets/api/quickstart/nodejs) para configurar unha aplicación e descarga o arquivo `credentials.json`. Os parámetros que están no atributo `installed`son os que se configuran no `config.json` no apartado `google_credentials`.

Unha vez feito, é preciso arrancar manualmente á aplicación como se indica abaixo e seguir os pasos pra que xenere o arquivo `token.json`, co que se autentificará con google para consultar os datos da folla de cálculo.

No apartado `google_spreadsheet`, indicase o documento e o rango onde estan os datos.

### Envío de Tweets

Tamén se pode configurar o robot para que envíe tweets cos novos videos. Para iso é preciso dar de alta un proxecto no [Portal do Desenvolvedor de Twitter](https://developer.twitter.com/en/portal/projects/) e habilitar a autentificación e os permisos de escritura. Pódense seguir as documentacións da [librería twitter-api-v2](https://www.npmjs.com/package/twitter-api-v2).

Unha vez feito, descomentar na configuración o apartado de twitter e indicar os datos (apiKey,apiSecret,accessToken,accessSecret) e a plantilla da mensaxe que queremos usar. Ollo con respetar as variables entre chaves `{}`, xa que serán sustituídas pola información do vídeo ou da excel.

### Configuración

Para configurar Timbot, copia o arquivo incluído `config-sample.js` a `config.js` e introduce ou personaliza os valores do arquivo.

```js
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
	google_credentials: {
		// Son os datos obtidos da API de Google Sheets. No arquivo `credentials.json`
	},
	// Se queres mandar tamén notificacións en twitter, terás que crear unha app no Developer Center de twitter e poñer os datos precisos. Se non, déixao comentado
	/* twitter: {
		appKey: '',
		appSecret:'',
		accessToken: '',
		accessSecret: '',
		messageTemplate: '(🤖🤖Isto é unha proba dun bot, sorry 🤖🤖)\n\n{channelName} {twitterUser} acaba de publicar o vídeo "{title}" no Youtube. Dálle unha ollada en\n{url}',
	}, */
	// Se queres mandar tamén notificacións en mastodon, terás que crear unha conta bot cunha app de desenvolvemento. Se non, déixao comentado
	/* mastodon: {
		access_token: '',
		timeout_ms: 60 * 100,
		api_url: 'https://botsin.space/api/v1/',
		messageTemplate: '🤖 {channelName} acaba de publicar o vídeo "{title}" no #GalegoTube #Youtubeiras. Dálle unha ollada en\n{url}',
	}, */
};
```

### Arrincando galtubot

Unha vez configurada, podes arrancar a aplicación para probala utilizando `node` dende o directorio de instalación:

    node .

### Configurar galtubot como servizo

Opcionalmente, pódese configurar coma servizo nun servidor linux para que estea correndo permanentemente. Para iso, asumindo que está instalado na ruta `/opt/galtubot`, copiar o arquivo `galtubot.service` en `/etc/systemd/system`. Crear o usuario `galtubot` e asignarlle a propiedade da carpeta `/opt/galtubot`. Unha vez feito, activalo e arrincar o servizo

    useradd -r -s /bin/false galtubot
    chown galtubot:galtubot /opt/galtubot -R
    systemctl enable galtubot
    systemctl start galtubot
### Configurar Galtubot como docker

Tamén podes configurar o servizo con un contenedor docker, para iso, constrúe a imaxe e lanza o contenedor cos seguintes comandos:
   ```sh
   docker build -t pvillaverde/galtubot .
   docker run --name galtubot  -d pvillaverde/galtubot
   ```

### Invitando o teu galtubot

Envía a seguinte ligazón o administrador do servidor de Discord no que queiras invitar o teu robot:

`https://discordapp.com/oauth2/authorize?client_id=ID_CLIENTE_ROBOT&scope=bot`

Cambia `ID_CLIENTE_ROBOT` na URL pola ID de cliente da túa aplicación de Discord, que podes atopala nos detallees da aplicación.

## Problemas coñecidos

O Bot poderíase configurar para utilizar a propia API de google, mediante credenciais habilitadas para Youtube, pero para un volume tan amplo coma as canlees de Youtube en galego, só se podería facer a consulta 1-2 veces o día.

Para poder facelo máis veces, o que fai o bot é consultar o RSS de cada canle, que non ten límite de uso. O principal inconvinte disto é que **as subidas de vídeo en modo "Estrea", é dicir, que se publican despois da subida, saen ó momento, cando aínda non se poden ver**. Non obstante, como a idea é dar a coñecer novas canles a comunidade, e ameirande parte das canles suben de xeito inmediato o contido, decidiuse utilizar este método para que os vídeos vaian chegando ó discord aos poucos, e non 50 vídeos á vez.

## Creditos

O descubrimento e recollida de todas as canles galegas é grazas a Fran, de [A Lobeira Today](https://www.youtube.com/channel/UCZZTH6dVk9k_ah6OpZ-w7ZA)

Baseado tanto no Timbot utilizado para o bot de [twitch en galego](https://github.com/pvillaverde/twitchgalegobot) coma no [youtube-notification-bot](https://github.com/Snowflake107/youtube-notification-bot)

Se atopas algún erro ou es un dos autores e pensas que hai algún erro, contacta conmigo!
