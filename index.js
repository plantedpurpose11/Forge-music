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
const getConfig = require("./util/getConfig");
const deployCommands = async (client) => {
	console.log("[Deploy] Starting deployment check...");
	const config = await getConfig();
	console.log("[Deploy] Config loaded, deployCommands:", config.deployCommands);
	
	if (!config.deployCommands) {
		console.log("[Deploy] No deployCommands config, returning early");
		return;
	}
	
	const { global, guildId } = config.deployCommands;
	console.log("[Deploy] Extracted - global:", global, "guildId:", guildId);
	
	const rest = new REST({ version: "9" }).setToken(config.token);
	console.log("[Deploy] REST client created with token");
	
	if (!config.token) {
		console.log("[Deploy] ERROR: Bot token not configured!");
		return;
	}
	console.log("[Deploy] Token present");
	
	if (!config.clientId) {
		console.log("[Deploy] ERROR: Client ID not configured!");
		return;
	}
	console.log("[Deploy] Client ID:", config.clientId);
	
	const commands = await LoadCommands().then((cmds) => {
		return [].concat(cmds.slash).concat(cmds.context);
	});
	console.log(`[Deploy] Loaded ${commands.length} commands`);
	
	// Deploy globally first
	if (global && config.clientId) {
		console.log("[Deploy] Attempting global deployment...");
		try {
			await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
			console.log("[Deploy] Global deployment SUCCESS!");
		} catch (globalErr) {
			console.log("[Deploy] Global deployment FAILED:", globalErr.message);
		}
	} else {
		console.log("[Deploy] Skipping global (global:", global, ")");
	}
	
	// Then deploy to guild
	if (guildId && config.clientId) {
		console.log(`[Deploy] Attempting guild deployment for ${guildId}...`);
		try {
			await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body: commands });
			console.log("[Deploy] Guild deployment SUCCESS!");
		} catch (guildErr) {
			console.log("[Deploy] Guild deployment FAILED:", guildErr.message);
			if (guildErr.response) {
				console.log("[Deploy] Response:", JSON.stringify(guildErr.response.data));
			}
		}
	} else {
		console.log("[Deploy] Skipping guild - guildId is:", guildId);
	}
	
	console.log("[Deploy] Deployment complete");
};

// Wait for client to be ready then deploy
client.once("ready", () => {
	deployCommands(client);
});

const getClient = () => client;

module.exports = {
	getClient,
};
