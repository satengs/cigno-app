/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import useProjectChat from '../../src/lib/hooks/useProjectChat.js';

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1
}));

describe('useProjectChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { messages: [] }
      })
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useProjectChat('project-123'));

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should send message successfully', async () => {
    const { result } = renderHook(() => useProjectChat('project-123'));

    await act(async () => {
      await result.current.sendMessage('Hello, world!');
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/chat/project',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Hello, world!')
      })
    );
  });

  it('should handle loading states', async () => {
    // Mock slow API response
    let resolvePromise;
    fetch.mockImplementation(() => 
      new Promise(resolve => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => useProjectChat('project-123'));

    act(() => {
      result.current.sendMessage('Test message');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { message: 'Response' }
        })
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle API errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        success: false,
        error: 'Server error'
      })
    });

    const { result } = renderHook(() => useProjectChat('project-123'));

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(result.current.error).toBe('Server error');
  });

  it('should clear messages', () => {
    const { result } = renderHook(() => useProjectChat('project-123'));

    // Add some messages first
    act(() => {
      result.current.messages.push({ id: '1', text: 'Test message' });
    });

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('should handle different project IDs', () => {
    const { result: result1 } = renderHook(() => useProjectChat('project-1'));
    const { result: result2 } = renderHook(() => useProjectChat('project-2'));

    expect(result1.current).not.toBe(result2.current);
  });

  it('should handle WebSocket connection', () => {
    const { result } = renderHook(() => useProjectChat('project-123'));

    act(() => {
      result.current.connect();
    });

    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('ws')
    );
  });

  it('should handle WebSocket disconnection', () => {
    const mockWebSocket = {
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    global.WebSocket.mockReturnValueOnce(mockWebSocket);

    const { result, unmount } = renderHook(() => useProjectChat('project-123'));

    act(() => {
      result.current.connect();
    });

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('should retry failed connections', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} })
    });

    const { result } = renderHook(() => useProjectChat('project-123'));

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    // Should have retried the request
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle message history loading', async () => {
    const mockMessages = [
      { id: '1', text: 'Message 1', timestamp: new Date() },
      { id: '2', text: 'Message 2', timestamp: new Date() }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { messages: mockMessages }
      })
    });

    const { result } = renderHook(() => useProjectChat('project-123'));

    await act(async () => {
      await result.current.loadHistory();
    });

    expect(result.current.messages).toEqual(mockMessages);
  });
});