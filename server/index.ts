import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
// import path from 'path';
import FormData from 'form-data';
import fs from 'fs';

import { ExpectedJsonMessageComputerCreated } from './types/messages';

const wss = new WebSocketServer({ port: 8181 });

// I'm maintaining all active connections in this object
const clients: any = {};

// VM
let computer;

type VmConfig = {
  extension?: {
    field: string;
  };
  ublock: boolean;
  kiosk: boolean;
  start_url: string;
  dark: boolean;
};

function buildFormWithExtension(extPath: string, vmConfig: VmConfig) {
  const formData = new FormData();
  formData.append('ex', fs.createReadStream(extPath));
  formData.append('body', JSON.stringify(vmConfig));
  return formData;
}

function buildForm(vmConfig: VmConfig) {
  const formData = new FormData();
  formData.append('body', JSON.stringify(vmConfig));
  return formData;
}

wss.on('connection', function connection(ws) {
  // Generate a unique code for every user
  const userId = uuidv4();
  console.log(`Recieved a new connection.`);

  // Store the new connection and handle messages
  clients[userId] = connection;
  console.log(`${userId} connected.`);

  ws.on('message', async function message(_data) {
    const data = JSON.parse(_data.toString());
    console.log(data);
    console.log('received: %s', data);
    if (data.type === 'computer:init') {
      // computer create, with chrome extension
      // const zipPath = path.resolve('./chrome-extension.zip');
      const formData = buildForm({
        /*extension: {
                    field: 'ex',
                },*/
        ublock: true,
        kiosk: true,
        start_url: 'https://youtube.com',
        dark: true,
      });
      const headers = formData.getHeaders();
      headers['Authorization'] = `Bearer ${process.env.HB_API_KEY}`;
      const resp = await axios.post('https://engine.hyperbeam.com/v0/vm', formData, {
        headers,
      });

      const message: ExpectedJsonMessageComputerCreated = {
        type: 'computer:created',
        embed_url: resp.data.embed_url,
      };

      ws.send(
        JSON.stringify(message),
      );
      // end computer create
    }

    // TODO: End Session
  });
});
