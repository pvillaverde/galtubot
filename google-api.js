const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const config = require('./config.js');
const moment = require('moment');
const FileDatabaseService = require('./fileDatabase.service.js');
const { version } = require('moment');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/youtube.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Google Sheets Api Helper.
 */
class GoogleApi {
	static handleApiError(error, message) {
		if (message) {
			console.error('[GoogleApi]', 'API request failed with error:', error, message);
		} else {
			console.error('[GoogleApi]', 'API request failed with error:', error);
		}
		new FileDatabaseService('live-messages').put('last-error', moment());
	}

	/**
	 * Create an OAuth2 client with the given credentials, and then execute the
	 * given callback function.
	 */
	static authorize() {
		return new Promise((resolve, reject) => {
			const { client_secret, client_id, redirect_uris } = config.google_credentials;
			const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
			// Check if we have previously stored a token.
			fs.readFile(TOKEN_PATH, (err, token) => {
				if (err) return this.getNewToken(oAuth2Client).then((oAuthClient) => resolve(oAuthClient));
				oAuth2Client.setCredentials(JSON.parse(token));
				resolve(oAuth2Client);
			});
		});
	}

	/**
	 * Get and store new token after prompting for user authorization, and then
	 * execute the given callback with the authorized OAuth2 client.
	 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
	 * @param {getEventsCallback} callback The callback for the authorized client.
	 */
	static getNewToken(oAuth2Client) {
		return new Promise((resolve, reject) => {
			const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
			console.log('Authorize this app by visiting this url:', authUrl);
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});
			rl.question('Enter the code from that page here: ', (code) => {
				rl.close();
				oAuth2Client.getToken(code, (err, token) => {
					if (err) {
						this.handleApiError(err, 'Error while trying to retrieve access token');
						return reject(err);
					}
					oAuth2Client.setCredentials(token);
					// Store the token to disk for later program executions
					fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
						if (err) {
							this.handleApiError(err, 'Error while trying to store access token');
							return reject(err);
						}
						console.log('Token stored to', TOKEN_PATH);
					});
					resolve(oAuth2Client);
				});
			});
		});
	}
	/**
	 * Recupera as filas dunha folla de cálculo de google
	 * @param spreadsheet A configuración de spreadsheet indicada na configuración
	 */
	static fetchSpreadsheetData(spreadSheet) {
		return this.authorize().then(
			(auth) =>
				new Promise((resolve, reject) => {
					const sheets = google.sheets({ version: 'v4', auth });
					sheets.spreadsheets.values.get({ spreadsheetId: spreadSheet.id, range: spreadSheet.range }, (err, res) => {
						if (err) {
							this.handleApiError(err, 'The Api returned an error');
							return reject(err);
						}
						const rows = res.data.values;
						if (rows.length) {
							const headers = spreadSheet.headers.split(',');
							// Map row columns to object propertiesPrint columns A and E, which correspond to indices 0 and 4.
							const mappedRows = rows.map((row) => {
								const newRow = {};
								for (var i = 0; i < headers.length; i++) {
									newRow[headers[i]] = row[i];
									//newRow[headers[i]] = this.sanitizeField(row[i]);
								}
								return newRow;
							});
							resolve(mappedRows);
						} else {
							this.handleApiError(err, '[Sheets] No data found');
							reject(err);
						}
					});
				})
		);
	}
	/**
	 * Recupera o listado dos últimos 10 vídeos da canle indicada de youtube.
	 * @param channelId A ID da canle de youtube
	 */
	static fetchLatestVideos(channelId) {
		return this.authorize().then(
			(auth) =>
				new Promise((resolve, reject) => {
					const youtube = google.youtube({ version: 'v3', auth });
					youtube.search
						.list({
							part: ['snippet'],
							channelId,
							maxResults: 10,
							order: 'date',
							type: ['video'],
						})
						.then((response) => resolve(response))
						.catch((error) => {
							this.handleApiError(error, '[Youtube] No data found');
							reject(error);
						});
				})
		);
	}

	static sanitizeField(field) {
		return field.toLowerCase().replace('\r\n', '').replace('\r', '').replace('\n', '');
	}
}

module.exports = GoogleApi;
