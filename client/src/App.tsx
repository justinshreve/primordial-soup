import Hyperbeam from '@hyperbeam/web';
import { useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { ExpectedJsonMessage } from './types/server/messages';

const socketUrl = 'ws://localhost:8181';

export default function App() {
  const { sendMessage, lastJsonMessage, readyState } = useWebSocket<ExpectedJsonMessage>(socketUrl);
  const virtualComputerDiv = document.getElementById('virtualComputerDiv') as HTMLDivElement;

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    async function messageHandler() {
      if (!lastJsonMessage) {
        return;
      }

      switch (lastJsonMessage.type) {
        case 'computer:created':
          await Hyperbeam(virtualComputerDiv, lastJsonMessage.embed_url);
          break;
      }
    }
    messageHandler();
  }, [lastJsonMessage]);

  // https://docs.hyperbeam.com/client-sdk/javascript/examples#control-tabs-programmatically

  /*
   * TODO:
   * User Authentication
   * User Management / Roles
   * Build process for server / making extension
   * Destory VM
   * Basic layout
   * Navigation controls
   * Playlist management
   * Playlist viewing
   * Chat
   * User settings
   * GIFs and Emoji Picker
   * Rooms
   */

  const handleClickSendMessage = useCallback(
    () => sendMessage(JSON.stringify({ type: 'computer:init' })),
    [],
  );

  return (
    <div>
      <div>
        <button onClick={handleClickSendMessage} disabled={readyState !== ReadyState.OPEN}>
          Click Me to send 'Hello'
        </button>
        <span>The WebSocket is currently {connectionStatus}</span>
      </div>
      <div>
        <div id="virtualComputerDiv"></div>
      </div>
    </div>
  );
}
