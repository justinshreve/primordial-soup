export type ExpectedJsonComputerInit = {
  type: 'computer:init';
};

export type ExpectedJsonComputerCreated = {
  type: 'computer:created';
  room: string;
  embed_url: string;
  session_id: string;
};

export type ExpectedJsonRoomInfo = {
  type: 'room:info';
  slug: string;
  name: string;
  description: string;
  hb_session_id?: string;
  embed_url?: string;
};

export type ExpectedJsonMessage =
  | ExpectedJsonComputerInit
  | ExpectedJsonComputerCreated
  | ExpectedJsonRoomInfo;
