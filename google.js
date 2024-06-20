const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
const {GoogleAuth} = require('google-auth-library');

const SCOPES = [
    'https://www.googleapis.com/auth/drive'
];

async function loadSavedCredentialsIfExist(tokenPath) {
    try {
        const content = fs.readFileSync(tokenPath);
        return JSON.parse(content);
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client, tokenPath) {
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: client._clientId,
        client_secret: client._clientSecret,
        refresh_token: client.credentials.refresh_token,
    });
    fs.writeFileSync(tokenPath, payload);
}

async function authorize(credentialsPath, tokenPath) {
    const { client_secret, client_id, redirect_uris } = JSON.parse(fs.readFileSync(credentialsPath)).installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const token = await loadSavedCredentialsIfExist(tokenPath);
    if (token) {
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    }

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return reject(err);
                oAuth2Client.setCredentials(token);
                saveCredentials(oAuth2Client, tokenPath);
                resolve(oAuth2Client);
            });
        });
    });
}

async function uploadFile(auth, filePath, mimeType) {
    const drive = google.drive({ version: 'v3', auth });
    const fileMetadata = {
        name: path.basename(filePath),
    };
    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
    };
    const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    });
    console.log('File ID:', file.data.id);
    return file.data.id;
}

async function downloadFile(auth, filePath, destinationPath) {
    const drive = google.drive({ version: 'v3', auth });

    // Search for the file by its name
    const res = await drive.files.list({
        q: `name='${path.basename(filePath)}'`,
        fields: 'files(id, name)',
    });

    const files = res.data.files;
    if (!files.length) {
        throw new Error(`File not found: ${filePath}`);
    }

    const fileId = files[0].id;
    const fileName = files[0].name;

    // If destinationPath is a directory, append the file name
    if (fs.existsSync(destinationPath) && fs.lstatSync(destinationPath).isDirectory()) {
        destinationPath = path.join(destinationPath, fileName);
    }

    const dest = fs.createWriteStream(destinationPath);
    const fileRes = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
    );
    fileRes.data
        .on('end', () => {
            console.log('Done downloading file.');
        })
        .on('error', err => {
            console.error('Error downloading file.', err);
        })
        .pipe(dest);
}

async function createFolder(auth, name) {
    // Get credentials and build service
    // TODO (developer) - Use appropriate auth mechanism for your app
    const service = google.drive({version: 'v3', auth});
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
    };
    try {
      const file = await service.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });
      console.log('Folder Id:', file.data.id);
      return file.data.id;
    } catch (err) {
      // TODO(developer) - Handle error
      throw err;
    }
  }

async function listFiles(auth, folderName) {
    const drive = google.drive({ version: 'v3', auth });

    // Find the folder by its name
    const folderRes = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
    });

    const folders = folderRes.data.files;
    if (!folders.length) {
        throw new Error(`Folder not found: ${folderName}`);
    }

    const folderId = folders[0].id;

    // List all files within the folder
    const filesRes = await drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id, name)',
    });

    const files = filesRes.data.files;
    files.forEach((file) => {
        console.log('Found file:', file.name, file.id);
    });

    return files;
}

( async () => {
    const credentialsPath = 'credentials.json';
    const tokenPath = 'token.json';
    const auth = await authorize(credentialsPath, tokenPath);
    
    console.log( await createFolder(auth, 'bot-discord'))

    console.log(await listFiles(auth, 'bot-discord'))
})();

// // Example usage:
// (async () => {
//     const credentialsPath = 'credentials.json';
//     const tokenPath = 'token.json';
//     const auth = await authorize(credentialsPath, tokenPath);

//     // Upload a file
//     const filePath = path.join(__dirname, 'bee.txt');
//     const mimeType = 'text/plain';
//     const fileId = await uploadFile(auth, filePath, mimeType);

//     // List files
//     const directoryName = '/Discord';
//     await listFiles(auth, directoryName);

//     // Download a file using its path
//     const sourceFilePath = '/Discord/bee.txt'; // The name of the file in Google Drive
//     const destinationPath = path.join(__dirname, '/downloaded/'); // Ensure this includes the directory
//     await downloadFile(auth, sourceFilePath, destinationPath);
// })();

