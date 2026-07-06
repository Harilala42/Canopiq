import { jest } from '@jest/globals';

export const mockChannels: Record<string, { onCallback: Function; eventConfig: any; }> = {};

export const supabase = {
  channel: jest.fn().mockImplementation((channelName: string) => {
    const onMock = jest.fn();
    const subscribeMock = jest.fn();

    mockChannels[channelName] = {
      onCallback: () => {},
      eventConfig: {}
    };

    const channelMock = {
      on: onMock.mockImplementation((event: string, config: any, callback: Function) => {
        mockChannels[channelName] = { onCallback: callback, eventConfig: config };
        return channelMock;
      }),
      subscribe: subscribeMock.mockImplementation(() => {
        return channelMock;
      })
    };

    return channelMock;
  }),

  removeChannel: jest.fn(),
};
