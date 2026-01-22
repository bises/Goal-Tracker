import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  maxWidth?: string;
  maxHeight?: string;
  closeOnBackdropClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = '90%',
  maxWidth = '600px',
  maxHeight = '80vh',
  closeOnBackdropClick = true,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[90vw] max-h-[85vh] overflow-y-auto"
        style={{
          width: width,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
        }}
        onInteractOutside={(e) => {
          if (!closeOnBackdropClick) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
