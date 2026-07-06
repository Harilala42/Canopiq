import { renderHook, waitFor, act } from '@testing-library/react';
import { useChatController } from './useChatController';
import { MessageAPI } from '@/api/message.api';
import { AnalysisAPI } from '@/api/analysis.api';
import { ChatData, MessageData } from '@/types/chat';
import { GeoAnalysis } from '@/types/analysis';

import useMapStore from '@/stores/useMapStore';
import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { supabase, mockChannels } from '@/utils/__mocks__/supabase.utils';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

// Mock APIs and Stores cleanly without duplicate root mocks
jest.mock('@/api/message.api');
jest.mock('@/api/analysis.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/stores/useAnalyticsStore');
jest.mock('@/stores/useMapStore');
jest.mock('@/utils/supabase.utils', () => {
  return jest.requireActual('@/utils/__mocks__/supabase.utils');
});
jest.mock('@/contexts/alertContext', () => {
  return jest.requireActual('@/contexts/__mocks__/alertContext');
});

describe('useChatController', () => {
  const mockQuery: ChatData = {
    id: 'chat-uuid-111',
    title: 'Biomass Tracking Run',
    created_at: '2026-06-04T12:00:00Z',
    is_pinned: false,
  };

  const mockMessages: MessageData[] = [
    { id: 'm1', role: 'user', content: 'Hello', created_at: '2026-06-04T12:01:00Z' },
    { id: 'm2', role: 'model', content: 'Hi there', created_at: '2026-06-04T12:01:05Z' },
  ];

  const mockGeoAnalysis: GeoAnalysis = {
    id: 'analysis-123',
    location: 'Singapore',
    dataset: 'carbon_density',
    bbox: {   // PostGIS Polygon geometry
      type: 'Polygon',
      coordinates: [[[103.8, 1.3], [103.9, 1.3], [103.9, 1.4], [103.8, 1.4], [103.8, 1.3]]]
    },
    coordinates: {
      type: 'Point',
      coordinates: [103.82, 1.35] // [lng, lat]
    },
    h3_grid_map_id: 'h3-map-999',
    start_year: '2026',
    end_year: '2026',
    analytics: {
      stats: { global_average: 10, area_coverage_ha: 100, total_change_percent: 0 },
      insights: [],
      metadata: { kind: 'time_series', type: 'carbon_density', unit: 't', legend: '', source: '', description: '' }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    for (const key in mockChannels) {
      delete mockChannels[key];
    }

    // Default pristine store implementations
    useChatStore.setState({ currentQuery: null, isOpen: false });
    useMessageStore.setState({ messages: [], isLoading: false });
    useAnalyticsStore.setState({ analyses: {}, activeAnalysis: null });
    useMapStore.setState({ maps: {}, activeMapId: null });
  });

  // =========================================================================
  // 1. CHAT MESSAGES SECTOR (retrieveChatMessages)
  // =========================================================================
  describe('retrieveChatMessages functionality', () => {
    it('should immediately break out and do nothing if currentQuery id is missing or null', () => {
      useChatStore.setState({ currentQuery: null });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      expect(MessageAPI.getAll).not.toHaveBeenCalled();
      expect(supabase.channel).not.toHaveBeenCalled();

      const msgStore = useMessageStore.getState();
      expect(msgStore.setIsLoading).not.toHaveBeenCalled();
      expect(msgStore.setMessages).not.toHaveBeenCalled();
    });

    it('should break out and avoid syncing database metrics if currentQuery is marked as isNew', () => {
      useChatStore.setState({ currentQuery: { ...mockQuery, isNew: true } });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      expect(MessageAPI.getAll).not.toHaveBeenCalled();
      expect(AnalysisAPI.getAll).not.toHaveBeenCalled();
    });

    it('should clear old array frames, trigger loaders, and save new records on successful API resolve', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: mockMessages });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      const msgStoreActions = useMessageStore.getState();
      expect(msgStoreActions.setMessages).toHaveBeenCalledWith([]);
      expect(msgStoreActions.setIsLoading).toHaveBeenCalledWith(true);

      await waitFor(() => {
        expect(MessageAPI.getAll).toHaveBeenCalledWith('chat-uuid-111');
      });

      expect(msgStoreActions.setMessages).toHaveBeenLastCalledWith(mockMessages);
      expect(msgStoreActions.setIsLoading).toHaveBeenLastCalledWith(false);
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('should clear old items and terminate loading screen gracefully if server sends a null/empty response collection', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: null });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(MessageAPI.getAll).toHaveBeenCalled();
      });

      const msgStoreActions = useMessageStore.getState();
      expect(msgStoreActions.setIsLoading).toHaveBeenLastCalledWith(false);
      expect(msgStoreActions.setMessages).toHaveBeenCalledWith([]);
    });

    it('should handle unhandled API exceptions by turning off loaders and broadcasting an error alert context', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockRejectedValue(new Error('Internal Server Error 500'));
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(MessageAPI.getAll).toHaveBeenCalled();
      });

      const msgStoreActions = useMessageStore.getState();
      expect(msgStoreActions.setIsLoading).toHaveBeenLastCalledWith(false);
      expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to load chat messages. Try again later!');
    });
  });

  // =========================================================================
  // 2. GEOSPATIAL ANALYSIS SECTOR (fetchGeoAnalysisData)
  // =========================================================================
  describe('fetchGeoAnalysisData functionality', () => {
    it('should reset analyses and maps on initialization, then set states on successful analysis pull', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: [] });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [mockGeoAnalysis] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      const analyticsActions = useAnalyticsStore.getState();
      const mapActions = useMapStore.getState();

      // Immediate synchronous cleanup steps
      expect(analyticsActions.resetAnalyses).toHaveBeenCalled();
      expect(mapActions.clearMap).toHaveBeenCalled();

      await waitFor(() => {
        expect(AnalysisAPI.getAll).toHaveBeenCalledWith('chat-uuid-111');
      });

      // State population assertions
      expect(analyticsActions.setAnalyses).toHaveBeenCalledWith([mockGeoAnalysis]);
      expect(analyticsActions.setActiveAnalysis).toHaveBeenCalledWith(mockGeoAnalysis);
      expect(mapActions.setActiveMap).toHaveBeenCalledWith('h3-map-999');
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('should clean up map layers without activating new ones if geo_analysis collection returns empty', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: [] });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(AnalysisAPI.getAll).toHaveBeenCalled();
      });

      const analyticsActions = useAnalyticsStore.getState();
      const mapActions = useMapStore.getState();

      expect(analyticsActions.setAnalyses).not.toHaveBeenCalled();
      expect(mapActions.setActiveMap).not.toHaveBeenCalled();
    });

    it('should catch exceptions on fetchGeoAnalysisData failures and fire a distinctive user warning banner', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: [] });
      (AnalysisAPI.getAll as jest.Mock).mockRejectedValue(new Error('GIS DB Connection timeout'));

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(AnalysisAPI.getAll).toHaveBeenCalled();
      });

      expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to retrieve insight. Please try again later.');
    });
  });

  // =========================================================================
  // 3. REALTIME CHANNELS UPDATE TESTS
  // =========================================================================
  describe('Supabase Real-time Subscriptions', () => {
    it('should initialize real-time listeners with accurate filters on valid query active state', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: [] });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      // Verify explicit channel targeting descriptors
      expect(supabase.channel).toHaveBeenCalledWith('messages-chat-uuid-111');
      expect(supabase.channel).toHaveBeenCalledWith('geo_analysis-chat-uuid-111');

      // Verify specific Postgres Change rule filters mapped to currentQuery.id
      expect(mockChannels['messages-chat-uuid-111'].eventConfig).toEqual({
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'chat_id=eq.chat-uuid-111',
      });

      expect(mockChannels['geo_analysis-chat-uuid-111'].eventConfig).toEqual({
        event: 'INSERT',
        schema: 'public',
        table: 'geo_analysis',
        filter: 'chat_id=eq.chat-uuid-111',
      });
    });

    it('should process user messages by stripping temporary keys before adding them to state stores', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: [] });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      const msgStoreActions = useMessageStore.getState();
      const incomingPayload = { new: { id: 'real-m1', role: 'user', content: 'Optimistic swap verify' } };

      // Fire payload message subscriber hook action manually
      act(() => {
        mockChannels['messages-chat-uuid-111'].onCallback(incomingPayload);
      });

      expect(msgStoreActions.removeMessage).toHaveBeenCalledWith('temp-real-m1');
      expect(msgStoreActions.addMessage).toHaveBeenCalledWith(incomingPayload.new);
    });

    it('should handle incoming model responses directly without clearing temporary slots', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: [] });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      const msgStoreActions = useMessageStore.getState();
      const incomingPayload = { new: { id: 'model-m2', role: 'model', content: 'AI streaming chunk response' } };

      act(() => {
        mockChannels['messages-chat-uuid-111'].onCallback(incomingPayload);
      });

      expect(msgStoreActions.removeMessage).not.toHaveBeenCalled();
      expect(msgStoreActions.addMessage).toHaveBeenCalledWith(incomingPayload.new);
    });

    it('should dynamically append and configure map frames when a geoanalysis payload arrives', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: [] });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      renderHook(() => useChatController(), { wrapper: AlertProvider });

      const analyticsActions = useAnalyticsStore.getState();
      const mapActions = useMapStore.getState();
      const incomingPayload = { new: mockGeoAnalysis };

      act(() => {
        mockChannels['geo_analysis-chat-uuid-111'].onCallback(incomingPayload);
      });

      expect(analyticsActions.addAnalysis).toHaveBeenCalledWith(mockGeoAnalysis);
      expect(analyticsActions.setActiveAnalysis).toHaveBeenCalledWith(mockGeoAnalysis);
      expect(mapActions.setActiveMap).toHaveBeenCalledWith('h3-map-999');
    });

    it('should remove connection endpoints completely upon unmounting cycle routines', async () => {
      useChatStore.setState({ currentQuery: mockQuery });
      (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: [] });
      (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ geo_analysis: [] });

      const { unmount } = renderHook(() => useChatController(), { wrapper: AlertProvider });

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalledTimes(2);
    });
  });
});
