import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from './dialog';
import { Button } from './button';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (image: string) => void;
}

const videoConstraints = {
  width: 400,
  height: 300,
  facingMode: 'environment',
};

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  open,
  onOpenChange,
  onCapture,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setError(null);
      } else {
        setError('Failed to capture image.');
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onOpenChange(false);
      setCapturedImage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take a Photo</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col items-center justify-center min-h-[320px]'>
          {!capturedImage ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat='image/jpeg'
                videoConstraints={videoConstraints}
                className='rounded-lg border shadow-md'
              />
              {error && <div className='text-red-500 mt-2'>{error}</div>}
              <Button className='mt-4' onClick={handleCapture}>
                Capture Photo
              </Button>
            </>
          ) : (
            <>
              <img
                src={capturedImage}
                alt='Captured preview'
                className='rounded-lg border shadow-md max-w-full max-h-72'
              />
              <div className='flex gap-4 mt-4'>
                <Button variant='outline' onClick={handleRetake}>
                  Retake
                </Button>
                <Button onClick={handleConfirm}>Use Photo</Button>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='ghost'>Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
