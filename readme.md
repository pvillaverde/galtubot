# Galtubot

🤖 **Un robot sinxelo e que se pode personalizar. Anuncia aos novos vídeos da comunidade de Youtube en galego.**

## Características

- 📢 Comproba periódicamente as canles de Youtube indicadas nun arquivo de Google Drive e envía notificacións nunha canle de Discord.

## Cómo uso o robot?

Tes dúas opcións:

1. Podes [invitar ó bot de Youtube en Galego](https://discord.com/oauth2/authorize?client_id=805443544138907689&scope=bot) ó teu servidor de discord para recibir as notificacións da comunidade de Youtube en Galego (Tes que ter unha canle no servidor co nome `🟥youtube-galego`). Este bot é o que mantén a comunidade galega actualizando a lista de canles de Youtube segundo se vaian incorporando.

2. Ou, podes facer unha copia propia seguindo as instruccións de debaixo e personalizalo como che apeteza.

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

### Configuración

Para configurar Timbot, copia o arquivo incluído `config-sample.js` a `config.js` e introduce ou personaliza os valores do arquivo.

```js
module.exports = {
	discord_bot_token: 'DISCORD_BOT_TOKEN', // Token do Bot de discord
	discord_channel_name: '🟥youtube-galego', // Nome da canle de Discord
	messageTemplate: 'Boas rapazada!\n\n**{author}** acaba de subir o vídeo **{title}**!\n{url}', // Mensaxe plantilla
	watchInterval: 15 * 60 * 1000, // Intervalo de refresco en ms
	google_spreadsheet: {
		id: '1f3N-0N8b2ZoYjlH86ktKGHcznF-PH27SsIj0M_xYUhk', // Id da folla de google
		range: 'Youtube!A2:B', // Táboa e rango de celdas
		headers: 'id,name', // Cabeceiras das columnas
	},
	google_credentials: {
		// Son os datos obtidos da API de Google Sheets. No arquivo `credentials.json`
	},
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

### Invitando o teu galtubot

Envía a seguinte ligazón o administrador do servidor de Discord no que queiras invitar o teu robot:

`https://discordapp.com/oauth2/authorize?client_id=ID_CLIENTE_ROBOT&scope=bot`

Cambia `ID_CLIENTE_ROBOT` na URL pola ID de cliente da túa aplicación de Discord, que podes atopala nos detallees da aplicación.

## Creditos

Baseado tanto no Timbot utilizado para o bot de [twitch en galego](https://github.com/pvillaverde/twitchgalegobot) coma no [youtube-notification-bot](https://github.com/Snowflake107/youtube-notification-bot)

Se atopas algún erro ou es un dos autores e pensas que hai algún erro, contacta conmigo!
