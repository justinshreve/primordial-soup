export type ExpectedJsonMessageComputerInit = {
  type: 'computer:init';
};

export type ExpectedJsonMessageComputerCreated = {
  type: 'computer:created';
  embed_url: string;
};

export type ExpectedJsonMessage =
  | ExpectedJsonMessageComputerInit
  | ExpectedJsonMessageComputerCreated;
