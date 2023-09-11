import Hyperbeam from '@hyperbeam/web';
import { useCallback, useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { ExpectedJsonMessage } from './types/server/messages';
import { ExpectedJsonRoomInfo } from './types/server/rooms';

const socketUrl = 'ws://localhost:8181';

export default function App() {
  const { sendMessage, lastJsonMessage, readyState } = useWebSocket<
    ExpectedJsonMessage | ExpectedJsonRoomInfo
  >(socketUrl);
  const virtualComputerDiv = document.getElementById('virtualComputerDiv') as HTMLDivElement;

  const [room, setRoom] = useState('');
  const [hyperbeamSessionId, setHyperbeamSessionId] = useState('');
  const [hyperbeamEmbedUrl, setHyperbeamEmbedUrl] = useState('');

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'connecting',
    [ReadyState.OPEN]: 'connected',
    [ReadyState.CLOSING]: 'closing',
    [ReadyState.CLOSED]: 'closed',
    [ReadyState.UNINSTANTIATED]: 'uninstantiated',
  }[readyState];

  useEffect(() => {
    async function messageHandler() {
      if (!lastJsonMessage) {
        return;
      }

      console.log(lastJsonMessage);

      switch (lastJsonMessage.type) {
        case 'computer:created':
          setRoom(lastJsonMessage.room);
          setHyperbeamSessionId(lastJsonMessage.session_id);
          setHyperbeamEmbedUrl(lastJsonMessage.embed_url);
          await Hyperbeam(virtualComputerDiv, lastJsonMessage.embed_url);
          break;
        case 'room:info':
          setRoom(lastJsonMessage.slug);
          if (lastJsonMessage.hb_session_id) {
            setHyperbeamSessionId(lastJsonMessage.hb_session_id);
          } else {
            setHyperbeamSessionId('');
          }
          if (lastJsonMessage.embed_url) {
            setHyperbeamEmbedUrl(lastJsonMessage.embed_url);
            await Hyperbeam(virtualComputerDiv, lastJsonMessage.embed_url);
          } else {
            setHyperbeamEmbedUrl('');
          }
          break;
      }
    }
    messageHandler();
  }, [lastJsonMessage, virtualComputerDiv]);

  // https://docs.hyperbeam.com/client-sdk/javascript/examples#control-tabs-programmatically

  /*
   * TODO:
   * Send all relevent messages to all clients
   * Build process for extension
   * User Authentication
   * Basic layout
   * User Management / Roles
   * Navigation controls
   * Playlist management
   * Playlist viewing
   * Chat
   * User settings
   * GIFs and Emoji Picker
   * Rooms
   */

  const handleClick = useCallback(
    () =>
      hyperbeamSessionId
        ? sendMessage(JSON.stringify({ type: 'computer:shutdown', room }))
        : sendMessage(JSON.stringify({ type: 'computer:init' })),
    [room, hyperbeamSessionId, sendMessage],
  );

  return (
    <div>
      <div>
        <span>[primordial soup] is currently {connectionStatus}</span>
      </div>
      <div>
        <button onClick={handleClick} disabled={readyState !== ReadyState.OPEN}>
          {hyperbeamSessionId && hyperbeamEmbedUrl
            ? <span>Shutdown Hyperbeam</span>
            : <span>Start Hyperbeam</span>}
        </button>
      </div>
      <div>
        <div id="virtualComputerDiv"></div>
      </div>
    </div>
  );
}
