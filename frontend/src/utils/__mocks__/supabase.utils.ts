import { jest } from '@jest/globals';

const mockChannel: any = {};

mockChannel.on = jest.fn(() => mockChannel);
mockChannel.subscribe = jest.fn(() => mockChannel);

export const supabase = {
  channel: jest.fn(() => mockChannel),
  removeChannel: jest.fn(),
};
