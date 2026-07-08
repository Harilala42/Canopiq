import { jest } from '@jest/globals';

export const mockChannels: Record<string, { 
  onCallback: Function; 
  subscribeCallback: Function; 
  eventConfig: any; 
}> = {};

export const supabase = {
  channel: jest.fn().mockImplementation((channelName: string) => {
    const onMock = jest.fn();
    const subscribeMock = jest.fn();

    // Initialize the tracking object for the channel
    mockChannels[channelName] = {
      onCallback: () => {},
      subscribeCallback: () => {},
      eventConfig: {}
    };

    const channelMock = {
      on: onMock.mockImplementation((event: string, config: any, callback: Function) => {
        // Capture the postgres_changes callback
        mockChannels[channelName].onCallback = callback;
        mockChannels[channelName].eventConfig = config;
        
        return channelMock;
      }),
      subscribe: subscribeMock.mockImplementation((callback: Function) => {
        // Capture the connection status callback
        mockChannels[channelName].subscribeCallback = callback;
        
        return channelMock;
      })
    };

    return channelMock;
  }),

  removeChannel: jest.fn(),
};
