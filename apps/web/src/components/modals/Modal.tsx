import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

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
        className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
        style={{
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
