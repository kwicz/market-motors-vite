import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import CameraCapture from '../CameraCapture';

// Mock react-webcam
vi.mock('react-webcam', () => ({
  __esModule: true,
  default: React.forwardRef(
    (props: unknown, ref: React.ForwardedRef<HTMLDivElement>) => (
      <div
        data-testid='mock-webcam'
        ref={ref as React.RefObject<HTMLDivElement>}
      >
        Webcam Stream
      </div>
    )
  ),
}));

describe('CameraCapture', () => {
  it('renders and opens modal', () => {
    render(
      <CameraCapture open={true} onOpenChange={() => {}} onCapture={() => {}} />
    );
    expect(screen.getByText('Take a Photo')).toBeInTheDocument();
    expect(screen.getByTestId('mock-webcam')).toBeInTheDocument();
    expect(screen.getByText('Capture Photo')).toBeInTheDocument();
  });

  it('calls onOpenChange when closed', () => {
    const onOpenChange = vi.fn();
    render(
      <CameraCapture
        open={true}
        onOpenChange={onOpenChange}
        onCapture={() => {}}
      />
    );
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows preview and allows retake', () => {
    // Mock getScreenshot
    const getScreenshot = vi.fn(() => 'data:image/jpeg;base64,MOCKDATA');
    const webcamRef: React.MutableRefObject<unknown> = {
      current: { getScreenshot },
    };
    // Patch React.useRef to return our mock
    vi.spyOn(React, 'useRef').mockReturnValueOnce(webcamRef);

    render(
      <CameraCapture open={true} onOpenChange={() => {}} onCapture={() => {}} />
    );
    fireEvent.click(screen.getByText('Capture Photo'));
    expect(screen.getByAltText('Captured preview')).toBeInTheDocument();
    expect(screen.getByText('Retake')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retake'));
    expect(screen.getByText('Capture Photo')).toBeInTheDocument();
  });

  it('calls onCapture when Use Photo is clicked', () => {
    const getScreenshot = vi.fn(() => 'data:image/jpeg;base64,MOCKDATA');
    const webcamRef: React.MutableRefObject<unknown> = {
      current: { getScreenshot },
    };
    vi.spyOn(React, 'useRef').mockReturnValueOnce(webcamRef);
    const onCapture = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CameraCapture
        open={true}
        onOpenChange={onOpenChange}
        onCapture={onCapture}
      />
    );
    fireEvent.click(screen.getByText('Capture Photo'));
    fireEvent.click(screen.getByText('Use Photo'));
    expect(onCapture).toHaveBeenCalledWith('data:image/jpeg;base64,MOCKDATA');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
