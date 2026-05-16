//JotaroKujo0525 note, this is a deed that i should've done a long time ago
require('dotenv').config()

const DiscordMusicBot = require("./lib/DiscordMusicBot");
const { exec } = require("child_process");
const LoadCommands = require("./util/loadCommands");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

if (process.env.REPL_ID) {
	console.log("Replit system detected, initiating special `unhandledRejection` event listener.")
	process.on('unhandledRejection', (reason, promise) => {
		promise.catch((err) => {
			if (err.status === 429) {
				console.log("something went wrong whilst trying to connect to discord gateway, resetting...");
				exec("kill 1");
			}
		});
	});
}

const client = new DiscordMusicBot();

console.log("Make sure to fill in the config.js before starting the bot.");

// Auto-deploy commands on startup
const deployCommands = async (client) => {
	const config = await require("./util/getConfig");
	if (!config.deployCommands) return;
	
	const { global, guildId } = config.deployCommands;
	const rest = new REST({ version: "9" }).setToken(config.token);
	
	try {
		const commands = await LoadCommands().then((cmds) => {
			return [].concat(cmds.slash).concat(cmds.context);
		});
		
		if (global && config.clientId) {
			console.log("Deploying commands globally...");
			await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
			console.log("Successfully deployed global commands!");
		}
		
		if (guildId && config.clientId) {
			console.log(`Deploying commands to guild ${guildId}...`);
			await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body: commands });
			console.log("Successfully deployed guild commands!");
		}
	} catch (err) {
		console.log("Error deploying commands:", err.message);
	}
};

// Wait for client to be ready then deploy
client.once("ready", () => {
	deployCommands(client);
});

const getClient = () => client;

module.exports = {
	getClient,
};
