'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

// Base Modal Components
const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;

// Enhanced Backdrop with better styling
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Enhanced backdrop styling with softer colors
      'fixed inset-0 z-50 bg-gray-500/20 dark:bg-gray-900/40 backdrop-blur-sm',
      // Improved animations
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-300 ease-out',
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Enhanced Content with better styling
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  }
>(
  (
    { className, children, showCloseButton = true, size = 'md', ...props },
    ref,
  ) => (
    <DialogPrimitive.Portal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Base styling
          'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
          'w-full max-h-[90vh] overflow-hidden',
          // Enhanced background and border
          'bg-background border border-border shadow-2xl',
          'rounded-2xl', // More rounded corners for modern look
          // Improved animations
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'duration-300 ease-out',
          // Size variants
          {
            'max-w-sm': size === 'sm',
            'max-w-md': size === 'md',
            'max-w-lg': size === 'lg',
            'max-w-4xl': size === 'xl',
            'max-w-[95vw]': size === 'full',
          },
          className,
        )}
        {...props}
      >
        <div className="flex flex-col max-h-[90vh]">
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-5 w-5" />
              <span className="sr-only">닫기</span>
            </DialogPrimitive.Close>
          )}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
ModalContent.displayName = DialogPrimitive.Content.displayName;

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
    {...props}
  />
));
ModalHeader.displayName = 'ModalHeader';

const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-y-auto px-6', className)}
    {...props}
  />
));
ModalBody.displayName = 'ModalBody';

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col-reverse gap-2 p-6 pt-4 sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
));
ModalFooter.displayName = 'ModalFooter';

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

// Specialized Modal Types
interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string | React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  onConfirm: () => void;
  confirmText?: string;
  size?: 'sm' | 'md';
}

const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onOpenChange,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmText = '확인',
  size = 'sm',
}) => {
  const iconMap = {
    info: <Info className="h-6 w-6 text-blue-500" />,
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    error: <AlertCircle className="h-6 w-6 text-red-500" />,
  };

  const colorMap = {
    info: 'bg-blue-50 dark:bg-blue-950',
    success: 'bg-green-50 dark:bg-green-950',
    warning: 'bg-yellow-50 dark:bg-yellow-950',
    error: 'bg-red-50 dark:bg-red-950',
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size={size} showCloseButton={false}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-full p-2', colorMap[type])}>
              {iconMap[type]}
            </div>
            <ModalTitle>{title}</ModalTitle>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="py-2">
            {typeof message === 'string' ? (
              <p className="text-sm text-muted-foreground">{message}</p>
            ) : (
              message
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string | React.ReactNode;
  type?: 'warning' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  message,
  type = 'warning',
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  isLoading = false,
  size = 'sm',
}) => {
  const iconMap = {
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    danger: <AlertCircle className="h-6 w-6 text-red-500" />,
  };

  const colorMap = {
    warning: 'bg-yellow-50 dark:bg-yellow-950',
    danger: 'bg-red-50 dark:bg-red-950',
  };

  const buttonColorMap = {
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size={size} showCloseButton={false}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-full p-2', colorMap[type])}>
              {iconMap[type]}
            </div>
            <ModalTitle>{title}</ModalTitle>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="py-2">
            {typeof message === 'string' ? (
              <p className="text-sm text-muted-foreground">{message}</p>
            ) : (
              message
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={isLoading}
            className={buttonColorMap[type]}
          >
            {isLoading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Export all components
export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
  ModalOverlay,
  AlertModal,
  ConfirmModal,
};
