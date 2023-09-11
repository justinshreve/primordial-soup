import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import ws, { WebSocketServer } from 'ws';

import { ExpectedJsonMessage } from './types/messages';

const wss = new WebSocketServer({ port: 8181 });

// I'm maintaining all active connections in this object
const clients: any = {};

// VM
let computer;
type VmConfig = {
  extension?: {
    field: string;
  };
  ublock?: boolean;
  start_url?: string;
  dark?: boolean;
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

// assume soup for now
// TODO: implement multi-room support
const room = 'soup';

wss.on('connection', async function connection(ws) {
  const sendMessage = (message: ExpectedJsonMessage) => {
    ws.send(
      JSON.stringify(message),
    );
  };

  // Generate a unique code for every user
  const userId = uuidv4();
  console.log(`Recieved a new connection.`);
  clients[userId] = connection;
  console.log(`${userId} connected.`);

  const db = new sqlite3.Database('db/soup.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
  });

  db.all(`SELECT * FROM rooms ORDER BY name`, [], async (err, rows) => {
    if (err) {
      throw err;
    }
    const roomInfo: any = rows.find((row: any) => row.slug === room);
    if (roomInfo && roomInfo.hb_session_id) {
      const resp = await axios.get(`https://engine.hyperbeam.com/v0/vm/${roomInfo.hb_session_id}`, {
        headers: { 'Authorization': `Bearer ${process.env.HB_API_KEY}` },
      });
      const embedUrl = resp.data.embed_url;
      sendMessage({
        type: 'room:info',
        slug: roomInfo.slug,
        name: roomInfo.name,
        description: roomInfo.description,
        hb_session_id: roomInfo.hb_session_id,
        embed_url: embedUrl,
      });
    }
  });
  db.close();

  ws.on('message', async function message(_data) {
    const data = JSON.parse(_data.toString());
    console.log(data);
    console.log('received: %s', data);

    if (data.type === 'computer:init') {
      // const zipPath = path.resolve('./chrome-extension.zip');
      const formData = buildForm({
        /*extension: {
          field: 'ex',
        },*/
        ublock: true,
        start_url: 'https://youtube.com',
        dark: true,
      });
      const headers = formData.getHeaders();
      headers['Authorization'] = `Bearer ${process.env.HB_API_KEY}`;
      const resp = await axios.post('https://engine.hyperbeam.com/v0/vm', formData, {
        headers,
      });

      console.log(resp.data);

      const db = new sqlite3.Database('db/soup.db', (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Connected to database');
      });

      db.run(
        `UPDATE rooms SET hb_session_id = ? WHERE slug = ?`,
        [resp.data.session_id, room],
        function (err) {
          if (err) {
            return console.error(err.message);
          }
          console.log(`Row(s) updated: ${this.changes}`);
        },
      );
      db.close();

      sendMessage({
        type: 'computer:created',
        room: room,
        embed_url: resp.data.embed_url,
        session_id: resp.data.session_id,
      });
    }

    if (data.type === 'computer:shutdown' && data.room) {
      const db = new sqlite3.Database('db/soup.db', (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Connected to database');
      });

      db.get(
        `SELECT * FROM rooms WHERE slug = ?`,
        [data.room],
        async (err, roomInfo: any) => {
          if (err) {
            return console.error(err.message);
          }

          if (!roomInfo || !roomInfo.hb_session_id) {
            return;
          }

          db.run(
            `UPDATE rooms SET hb_session_id = '' WHERE slug = ?`,
            [data.room],
            function (err) {
              if (err) {
                return console.error(err.message);
              }
              console.log(`Row(s) updated: ${this.changes}`);
            },
          );

          sendMessage({
            type: 'room:info',
            slug: roomInfo.slug,
            name: roomInfo.name,
            description: roomInfo.description,
            hb_session_id: '',
            embed_url: '',
          });

          const resp = await axios.delete(
            `https://engine.hyperbeam.com/v0/vm/${roomInfo.hb_session_id}`,
            {
              headers: { 'Authorization': `Bearer ${process.env.HB_API_KEY}` },
            },
          );

          console.log(resp);
        },
      );

      db.close();
    }
  });
});
