import useChatStore from './useChatStore';
import { ChatData } from '@/types/chat';
import useMapStore from '@/stores/useMapStore';
import useMessageStore from '@/stores/useMessageStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';

// Mock other stores
jest.mock('@/stores/useMapStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/stores/useAnalyticsStore');

describe('useChatStore', () => {
  // Mock data
  const mockQuery1: ChatData = {
    id: '1',
    title: 'Query 1',
    created_at: '2026-01-01T00:00:00Z',
    is_pinned: false,
  };

  const mockQuery2: ChatData = {
    id: '2',
    title: 'Query 2',
    created_at: '2026-01-02T00:00:00Z',
    is_pinned: false,
  };

  const mockQuery3: ChatData = {
    id: '3',
    title: 'Query 3',
    created_at: '2026-01-03T00:00:00Z',
    is_pinned: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store state before each test to match actual implementation defaults
    useChatStore.setState({
      isOpen: false,
      queries: [],
      currentQuery: null,
      currentJobId: null,
    });
  });

  // ========== SETQUERIES TESTS ==========
  describe('setQueries', () => {
    it('should set queries array', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);

      expect(useChatStore.getState().queries).toEqual([mockQuery1, mockQuery2]);
    });

    it('should replace existing queries', () => {
      useChatStore.getState().setQueries([mockQuery1]);
      expect(useChatStore.getState().queries).toHaveLength(1);

      useChatStore.getState().setQueries([mockQuery2, mockQuery3]);
      expect(useChatStore.getState().queries).toHaveLength(2);
      expect(useChatStore.getState().queries).toEqual([mockQuery2, mockQuery3]);
    });

    it('should handle empty array', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      expect(useChatStore.getState().queries).toHaveLength(2);

      useChatStore.getState().setQueries([]);
      expect(useChatStore.getState().queries).toHaveLength(0);
    });
  });

  // ========== SETCURRENTQUERY TESTS ==========
  describe('setCurrentQuery', () => {
    it('should set current query', () => {
      useChatStore.getState().setCurrentQuery(mockQuery1);
      expect(useChatStore.getState().currentQuery).toEqual(mockQuery1);
    });

    it('should set current query to null', () => {
      useChatStore.getState().setCurrentQuery(mockQuery1);
      expect(useChatStore.getState().currentQuery).toEqual(mockQuery1);

      useChatStore.getState().setCurrentQuery(null);
      expect(useChatStore.getState().currentQuery).toBeNull();
    });

    it('should update current query if it is a completely different query ID', () => {
      useChatStore.getState().setCurrentQuery(mockQuery1);
      expect(useChatStore.getState().currentQuery).toEqual(mockQuery1);

      useChatStore.getState().setCurrentQuery(mockQuery2);
      expect(useChatStore.getState().currentQuery).toEqual(mockQuery2);
    });

    it('should skip setting reference if the same query id is passed again', () => {
      useChatStore.getState().setCurrentQuery(mockQuery1);
      
      const distinctRefWithSameId = { ...mockQuery1, title: 'Mutated title' };
      useChatStore.getState().setCurrentQuery(distinctRefWithSameId);
      
      expect(useChatStore.getState().currentQuery?.title).toBe('Query 1');
    });
  });

  // ========== JOB ID TRACKING TESTS ==========
  describe('setCurrentJobId', () => {
    it('should update current job processing identifier', () => {
      useChatStore.getState().setCurrentJobId('job-abc-123');
      expect(useChatStore.getState().currentJobId).toBe('job-abc-123');

      useChatStore.getState().setCurrentJobId(null);
      expect(useChatStore.getState().currentJobId).toBeNull();
    });
  });

  // ========== ADDQUERY TESTS ==========
  describe('addQuery', () => {
    it('should add a new query to the beginning of array', () => {
      useChatStore.getState().addQuery(mockQuery1);

      expect(useChatStore.getState().queries).toHaveLength(1);
      expect(useChatStore.getState().queries[0]).toEqual(mockQuery1);
    });

    it('should add multiple queries in correct order (newest first)', () => {
      useChatStore.getState().addQuery(mockQuery1);
      useChatStore.getState().addQuery(mockQuery2);
      useChatStore.getState().addQuery(mockQuery3);

      expect(useChatStore.getState().queries).toHaveLength(3);
      expect(useChatStore.getState().queries[0]).toEqual(mockQuery3);
      expect(useChatStore.getState().queries[1]).toEqual(mockQuery2);
      expect(useChatStore.getState().queries[2]).toEqual(mockQuery1);
    });

    it('should add query without affecting currentQuery', () => {
      useChatStore.getState().setCurrentQuery(mockQuery1);
      useChatStore.getState().addQuery(mockQuery2);

      expect(useChatStore.getState().currentQuery).toEqual(mockQuery1);
      expect(useChatStore.getState().queries[0]).toEqual(mockQuery2);
    });
  });

  // ========== UPDATEQUERY TESTS ==========
  describe('updateQuery', () => {
    it('should update query in queries array by id', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2, mockQuery3]);
      useChatStore.getState().updateQuery('2', { title: 'Updated Query 2' });

      const updatedQuery = useChatStore.getState().queries.find((q) => q.id === '2');
      expect(updatedQuery?.title).toBe('Updated Query 2');
      expect(updatedQuery?.id).toBe('2');
    });

    it('should update currentQuery if it matches the updated id', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      useChatStore.getState().setCurrentQuery(mockQuery1);
      useChatStore.getState().updateQuery('1', { title: 'Updated Title' });

      expect(useChatStore.getState().currentQuery?.title).toBe('Updated Title');
      expect(useChatStore.getState().currentQuery?.id).toBe('1');
    });

    it('should not affect currentQuery if updating different query', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      useChatStore.getState().setCurrentQuery(mockQuery1);
      const originalCurrentQuery = { ...useChatStore.getState().currentQuery! };

      useChatStore.getState().updateQuery('2', { title: 'Updated Query 2' });

      expect(useChatStore.getState().currentQuery).toEqual(originalCurrentQuery);
    });

    it('should handle partial updates', () => {
      useChatStore.getState().setQueries([mockQuery1]);
      useChatStore.getState().updateQuery('1', { is_pinned: true });

      const updated = useChatStore.getState().queries[0];
      expect(updated.is_pinned).toBe(true);
      expect(updated.title).toBe(mockQuery1.title);
      expect(updated.created_at).toBe(mockQuery1.created_at);
    });

    it('should not update if query id does not exist', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      const originalLength = useChatStore.getState().queries.length;

      useChatStore.getState().updateQuery('999', { title: 'Non-existent' });

      expect(useChatStore.getState().queries).toHaveLength(originalLength);
    });
  });

  // ========== DELETEQUERY TESTS ==========
  describe('deleteQuery', () => {
    it('should delete query from queries array', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2, mockQuery3]);
      expect(useChatStore.getState().queries).toHaveLength(3);

      useChatStore.getState().deleteQuery('2');

      expect(useChatStore.getState().queries).toHaveLength(2);
      expect(useChatStore.getState().queries.find((q) => q.id === '2')).toBeUndefined();
    });

    it('should clear currentQuery if deleted query is current', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      useChatStore.getState().setCurrentQuery(mockQuery1);
      expect(useChatStore.getState().currentQuery).toEqual(mockQuery1);

      useChatStore.getState().deleteQuery('1');

      expect(useChatStore.getState().currentQuery).toBeNull();
    });

    it('should preserve currentQuery if deleted query is not current', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      useChatStore.getState().setCurrentQuery(mockQuery1);

      useChatStore.getState().deleteQuery('2');

      expect(useChatStore.getState().currentQuery).toEqual(mockQuery1);
    });

    it('should call cleanup methods when deleting current query', () => {
      const mockClearMap = jest.fn();
      const mockResetMessages = jest.fn();
      const mockResetAnalyses = jest.fn();

      (useMapStore.getState as jest.Mock).mockReturnValue({
        clearMap: mockClearMap,
      });
      (useMessageStore.getState as jest.Mock).mockReturnValue({
        resetMessages: mockResetMessages,
      });
      (useAnalyticsStore.getState as jest.Mock).mockReturnValue({
        resetAnalyses: mockResetAnalyses,
      });

      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      useChatStore.getState().setCurrentQuery(mockQuery1);
      useChatStore.getState().deleteQuery('1');

      expect(mockClearMap).toHaveBeenCalled();
      expect(mockResetMessages).toHaveBeenCalled();
      expect(mockResetAnalyses).toHaveBeenCalled();
    });

    it('should NOT call cleanup methods when deleting non-current query', () => {
      const mockClearMap = jest.fn();
      const mockResetMessages = jest.fn();
      const mockResetAnalyses = jest.fn();

      (useMapStore.getState as jest.Mock).mockReturnValue({
        clearMap: mockClearMap,
      });
      (useMessageStore.getState as jest.Mock).mockReturnValue({
        resetMessages: mockResetMessages,
      });
      (useAnalyticsStore.getState as jest.Mock).mockReturnValue({
        resetAnalyses: mockResetAnalyses,
      });

      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      useChatStore.getState().setCurrentQuery(mockQuery1);
      useChatStore.getState().deleteQuery('2');

      expect(mockClearMap).not.toHaveBeenCalled();
      expect(mockResetMessages).not.toHaveBeenCalled();
      expect(mockResetAnalyses).not.toHaveBeenCalled();
    });

    it('should handle deleting from empty queries array', () => {
      useChatStore.getState().deleteQuery('1');

      expect(useChatStore.getState().queries).toHaveLength(0);
      expect(useChatStore.getState().currentQuery).toBeNull();
    });
  });

  // ========== SIDEBAR VISIBILITY TESTS ==========
  describe('Sidebar Layout Actions', () => {
    it('should explicitly open or close sidebar visibility flags', () => {
      useChatStore.getState().openSidebar();
      expect(useChatStore.getState().isOpen).toBe(true);

      useChatStore.getState().closeSideBar();
      expect(useChatStore.getState().isOpen).toBe(false);
    });

    it('should inverse sidebar layout state dynamically on toggleSideBar calls', () => {
      expect(useChatStore.getState().isOpen).toBe(false);

      useChatStore.getState().toggleSideBar();
      expect(useChatStore.getState().isOpen).toBe(true);

      useChatStore.getState().toggleSideBar();
      expect(useChatStore.getState().isOpen).toBe(false);
    });
  });

  // ========== INTEGRATION TESTS ==========
  describe('Integration scenarios', () => {
    it('should handle add, update, then delete sequence', () => {
      useChatStore.getState().addQuery(mockQuery1);
      useChatStore.getState().addQuery(mockQuery2);

      expect(useChatStore.getState().queries).toHaveLength(2);

      useChatStore.getState().updateQuery('1', { title: 'Updated' });

      const updated = useChatStore.getState().queries.find((q) => q.id === '1');
      expect(updated?.title).toBe('Updated');

      useChatStore.getState().deleteQuery('1');

      expect(useChatStore.getState().queries).toHaveLength(1);
      expect(useChatStore.getState().queries[0].id).toBe('2');
    });

    it('should maintain consistency across setQueries, add, update, delete', () => {
      useChatStore.getState().setQueries([mockQuery1, mockQuery2]);
      useChatStore.getState().setCurrentQuery(mockQuery1);

      expect(useChatStore.getState().queries).toHaveLength(2);
      expect(useChatStore.getState().currentQuery?.id).toBe('1');

      useChatStore.getState().addQuery(mockQuery3);

      expect(useChatStore.getState().queries).toHaveLength(3);
      expect(useChatStore.getState().queries[0].id).toBe('3');

      useChatStore.getState().updateQuery('1', { title: 'Updated Query 1' });

      expect(useChatStore.getState().currentQuery?.title).toBe('Updated Query 1');

      useChatStore.getState().deleteQuery('1');

      expect(useChatStore.getState().queries).toHaveLength(2);
      expect(useChatStore.getState().currentQuery).toBeNull();
    });
  });
});
