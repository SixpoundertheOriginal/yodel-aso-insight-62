
import { renderHook } from '@testing-library/react';
import { useComparisonData } from './useComparisonData';
import { useMockAsoData } from './useMockAsoData';
import { useAsoData } from '@/context/AsoDataContext';

// Mock the hooks we depend on
jest.mock('./useMockAsoData', () => ({
  useMockAsoData: jest.fn()
}));

jest.mock('@/context/AsoDataContext', () => ({
  useAsoData: jest.fn()
}));

describe('useComparisonData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should calculate correct date shift for period comparison', () => {
    // Mock the useAsoData hook
    const mockedCurrentDate = new Date('2023-01-30');
    const mockedStartDate = new Date('2023-01-01');
    
    (useAsoData as jest.Mock).mockReturnValue({
      data: { summary: {}, timeseriesData: [] },
      loading: false,
      error: null,
      filters: {
        clientList: ['TestClient'],
        dateRange: {
          from: mockedStartDate,
          to: mockedCurrentDate,
        },
        trafficSources: ['App Store Search']
      }
    });
    
    (useMockAsoData as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: null
    });

    renderHook(() => useComparisonData('period'));

    // Check that useMockAsoData was called with the correct previous date range
    expect(useMockAsoData).toHaveBeenCalledWith(
      ['TestClient'],
      expect.objectContaining({
        from: expect.any(Date),
        to: expect.any(Date)
      }),
      ['App Store Search']
    );
    
    // Extract the dates from the call
    const callArgs = (useMockAsoData as jest.Mock).mock.calls[0];
    const dateRange = callArgs[1];
    
    // Verify the previous period is correct
    // Should be Dec 3, 2022 - Dec 31, 2022 (29 day duration, same as Jan 1 - Jan 30)
    const expectedDuration = 29 * 24 * 60 * 60 * 1000; // 29 days in ms
    expect(dateRange.to.getTime() - dateRange.from.getTime()).toBeCloseTo(expectedDuration, -6); // Allow some ms variance
    expect(dateRange.to < mockedStartDate).toBeTruthy(); // Previous period ends before current begins
  });

  test('should calculate correct date shift for year comparison', () => {
    // Mock the useAsoData hook
    const mockedCurrentDate = new Date('2023-01-30');
    const mockedStartDate = new Date('2023-01-01');
    
    (useAsoData as jest.Mock).mockReturnValue({
      data: { summary: {}, timeseriesData: [] },
      loading: false,
      error: null,
      filters: {
        clientList: ['TestClient'],
        dateRange: {
          from: mockedStartDate,
          to: mockedCurrentDate,
        },
        trafficSources: ['App Store Search']
      }
    });
    
    (useMockAsoData as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: null
    });

    renderHook(() => useComparisonData('year'));

    // Check that useMockAsoData was called with the correct previous date range
    expect(useMockAsoData).toHaveBeenCalledWith(
      ['TestClient'],
      expect.objectContaining({
        from: expect.any(Date),
        to: expect.any(Date)
      }),
      ['App Store Search']
    );
    
    // Extract the dates from the call
    const callArgs = (useMockAsoData as jest.Mock).mock.calls[0];
    const dateRange = callArgs[1];
    
    // Verify the previous year range is exactly one year back
    expect(dateRange.from.getFullYear()).toBe(mockedStartDate.getFullYear() - 1);
    expect(dateRange.to.getFullYear()).toBe(mockedCurrentDate.getFullYear() - 1);
    expect(dateRange.from.getMonth()).toBe(mockedStartDate.getMonth());
    expect(dateRange.to.getMonth()).toBe(mockedCurrentDate.getMonth());
    expect(dateRange.from.getDate()).toBe(mockedStartDate.getDate());
    expect(dateRange.to.getDate()).toBe(mockedCurrentDate.getDate());
  });
});
