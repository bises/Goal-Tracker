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
        className="fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto md:relative md:bottom-auto md:left-auto md:right-auto md:max-h-[85vh] md:w-[90%] md:max-w-[600px] rounded-t-lg md:rounded-lg"
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
