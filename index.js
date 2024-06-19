require('dotenv').config();
const { Client, GatewayIntentBits, MessageAttachment } = require('discord.js');
const fs = require('fs').promises;
const fs_ = require('fs')
const path = require('path');

const scope = 'C:/Users/blueg/OneDrive/Pictures'

async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath);
        return data;
    } catch (error) {
        console.error(`Got an error trying to read the file: ${error.message}`);
        return null;
    }
}

function splitStringByLength(inputString, chunkLength) {
    // Check if inputString is a valid string and chunkLength is a positive integer
    if (typeof inputString !== 'string') {
        throw new Error('Invalid input: inputString must be a string.');
    } else if (!Number.isInteger(chunkLength) || chunkLength <= 0) {
        throw new Error('Invalid input: chunkLength must be a positive integer.')
    }

    const result = [];
    for (let i = 0; i < inputString.length; i += chunkLength) {
        result.push(inputString.substr(i, chunkLength));
    }
    return result;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

function getFolderInfo(folderPath) {
    try {
        // Read the contents of the directory
        const files = fs_.readdirSync(folderPath);

        // Construct the output string for TUI
        let output = `Contents of ${folderPath}:\n`;

        // Add each file/directory to the output string
        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            const stats = fs_.statSync(filePath);
            const fileType = stats.isDirectory() ? '📂' : '📄';
            output += `${fileType} \`${file}\`\n`;
        });

        return output;
    } catch (error) {
        return `Error reading folder: ${error.message}`;
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    var command = message.content.replace('<@1252314886084493414>', '').trim()

    console.log(command)

    const readPrefix = 'read: ';
    const beePrefix = 'bee';
    const dirPrefix = 'dir: '

    if (command.startsWith(readPrefix)){
        const request = command.slice(readPrefix.length).trim();
        const filePath = path.join(scope, request);

        try {
            await message.channel.send({ content: `Here is the file: ${path.basename(filePath)}`, files: [filePath] });
        } catch (error) {
            console.error(`Error reading file: ${error.message}`);
            message.channel.send('Error reading file.');
        }
    } else if (command === beePrefix) {
        const script = await readFile('bee.txt')
        const scriptArray = splitStringByLength(script.toString(), 1994)

        for (let i = 0; i < scriptArray.length; i++){
            await message.channel.send(`\`\`\`${scriptArray[i]}\`\`\``)
        }
    }   else if (command.startsWith(dirPrefix)) {
        const request = command.slice(dirPrefix.length).trim();
        const filePath = path.join(scope, request);

        try {
            await message.channel.send(getFolderInfo(filePath))
        } catch {
            message.channel.send('Error reading directory. :/')
        }
    }
});

client.login(process.env.CLIENT_TOKEN); // Replace with your actual bot token
