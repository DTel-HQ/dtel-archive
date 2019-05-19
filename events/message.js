module.exports = async msg => {
	if (msg.author.bot) return;

	const prefix = msg.content.startsWith(client.user) ? `${client.user} ` : config.prefix;

	let call = await Calls.find(c => c.to.channel == msg.channel.id || c.from.channel == msg.channel.id);

	let blacklisted = await Blacklist.get(msg.author.id);
	if (!blacklisted && msg.guild) blacklisted = await Blacklist.get(msg.guild.id);
	if (blacklisted) return;

	let cmd = msg.content.split(" ")[0].trim().toLowerCase().replace(prefix, "")
		.replace(/dial/g, "call");
	const suffix = msg.content.split(" ").splice(1).join(" ")
		.trim();

	let cmdFile;
	if (call && !msg.content.startsWith(prefix)) {
		return require("../Internals/callHandler.js")(cmd, msg, suffix);
	} else if (call && msg.content.startsWith(prefix)) {
		cmdFile = await reload(`./Commands/Call/${cmd}`);
	} else if (!cmdFile) {
		cmdFile = await reload(`./Commands/Public/${cmd}`);
	}

	if (!msg.content.startsWith(prefix)) return;

	if (config.maintainers.includes(msg.author.id) && !cmdFile) cmdFile = await reload(`./Commands/Private/${cmd}`);
	if (!cmdFile) return;

	if (cmdFile) {
		if (cmd !== "eval") winston.info(`[${cmd}] ${msg.author.tag} => ${msg.content}`);
		try {
			await cmdFile(client, msg, suffix);
		} catch (err) {
			msg.channel.send({
				embed: {
					color: 0xFF0000,
					title: ":x: Error!",
					description: `An unexpected error has occured.\n\`\`\`js\n${err.stack}\`\`\``,
					footer: {
						text: "Please contact a maintainer.",
					},
				},
			});
		}
	}
};
