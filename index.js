require('dotenv').config();
const { Client, GatewayIntentBits, MessageAttachment } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath);
        return data;
    } catch (error) {
        console.error(`Got an error trying to read the file: ${error.message}`);
        return null;
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    var command = message.content.replace('<@1252314886084493414>', '').trim()

    console.log(command)

    const commandPrefix = 'read: ';
    if (!command.startsWith(commandPrefix)) return;

    const request = command.slice(commandPrefix.length).trim();
    const filePath = path.join('C:/Users/blueg/OneDrive/Desktop', request);

    try {
        await message.channel.send({ content: `Here is the file: ${path.basename(filePath)}`, files: [filePath] });
    } catch (error) {
        console.error(`Error reading file: ${error.message}`);
        message.channel.send('Error reading file.');
    }
});

client.login(process.env.CLIENT_TOKEN); // Replace with your actual bot token
