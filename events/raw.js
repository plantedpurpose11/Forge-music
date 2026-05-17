/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {*} data
 */
module.exports = (client, data) => {
	// Check if manager is initialized and ready
	if (!client.manager) return;
	
	client.manager.updateVoiceState(data);
};
