'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from './button';

// =============================================================================
// Base Modal Components (Radix UI Wrapper)
// =============================================================================

const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;
const ModalPortal = DialogPrimitive.Portal;

// Enhanced Overlay with Design System Colors
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Design system backdrop with sage colors
      'fixed inset-0 z-50 bg-sage-20/60 dark:bg-sage-100/20 backdrop-blur-sm',
      // Smooth animations matching design system
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-300 ease-out',
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Modal size variants using cva
const modalVariants = cva(
  [
    // Base styling with design system tokens
    'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
    'w-full max-h-[90vh] overflow-hidden',
    // Design system colors and borders
    'bg-background-primary border border-border-subtle shadow-2xl',
    'rounded-2xl', // Design system rounded corners
    // Enhanced animations
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
    'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
    'duration-300 ease-out',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] max-h-[95vh]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

// Enhanced Content with Design System Integration
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    VariantProps<typeof modalVariants> & {
      showCloseButton?: boolean;
    }
>(({ className, children, showCloseButton = true, size, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(modalVariants({ size }), className)}
      {...props}
    >
      <div className="flex flex-col max-h-[90vh]">
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-background-primary transition-all hover:opacity-100 hover:bg-background-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-5 w-5" />
            <span className="sr-only">닫기</span>
          </DialogPrimitive.Close>
        )}
      </div>
    </DialogPrimitive.Content>
  </ModalPortal>
));
ModalContent.displayName = DialogPrimitive.Content.displayName;

// Modal layout components with design system spacing
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 p-6 pb-4 border-b border-border-subtle bg-background-secondary rounded-t-2xl',
      className,
    )}
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
    className={cn('flex-1 overflow-y-auto px-6 py-4', className)}
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
      'flex flex-col-reverse gap-2 p-6 pt-4 border-t border-border-subtle bg-background-secondary rounded-b-2xl',
      'sm:flex-row sm:justify-end sm:space-x-2',
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
      'text-xl font-semibold leading-none tracking-tight text-text-primary',
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
    className={cn('text-sm text-text-secondary', className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

// =============================================================================
// Specialized Modal Types with Design System Integration
// =============================================================================

// Alert Modal with emotion colors from design system
interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string | React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error' | 'happy' | 'peaceful';
  onConfirm?: () => void;
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
  // Enhanced icon mapping with emotion support
  const iconMap = {
    info: <Info className="h-6 w-6 text-info" />,
    success: <CheckCircle className="h-6 w-6 text-success" />,
    warning: <AlertTriangle className="h-6 w-6 text-warning" />,
    error: <AlertCircle className="h-6 w-6 text-error" />,
    happy: <span className="text-2xl">😊</span>,
    peaceful: <span className="text-2xl">😌</span>,
  };

  // Design system color mapping
  const colorMap = {
    info: 'bg-background-secondary',
    success: 'bg-emotion-peaceful-bg',
    warning: 'bg-emotion-unrest-bg',
    error: 'bg-emotion-angry-bg',
    happy: 'bg-emotion-happy-bg',
    peaceful: 'bg-emotion-peaceful-bg',
  };

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size={size} showCloseButton={false}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-full p-3 border border-border-subtle',
                colorMap[type],
              )}
            >
              {iconMap[type]}
            </div>
            <ModalTitle>{title}</ModalTitle>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="py-2">
            {typeof message === 'string' ? (
              <p className="text-sm text-text-secondary leading-relaxed">
                {message}
              </p>
            ) : (
              message
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-interactive-primary hover:bg-interactive-primary-hover text-text-on-color"
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Confirm Modal with design system styling
interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string | React.ReactNode;
  type?: 'warning' | 'danger';
  onConfirm: () => void;
  onCancel?: () => void;
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
    warning: <AlertTriangle className="h-6 w-6 text-warning" />,
    danger: <AlertCircle className="h-6 w-6 text-error" />,
  };

  const colorMap = {
    warning: 'bg-emotion-unrest-bg',
    danger: 'bg-emotion-angry-bg',
  };

  const buttonColorMap = {
    warning: 'bg-warning hover:bg-warning/90 text-text-on-color',
    danger: 'bg-error hover:bg-error/90 text-text-on-color',
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size={size} showCloseButton={false}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-full p-3 border border-border-subtle',
                colorMap[type],
              )}
            >
              {iconMap[type]}
            </div>
            <ModalTitle>{title}</ModalTitle>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="py-2">
            {typeof message === 'string' ? (
              <p className="text-sm text-text-secondary leading-relaxed">
                {message}
              </p>
            ) : (
              message
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-border-strong hover:bg-background-hover"
          >
            {cancelText}
          </Button>
          <Button
            variant="outline"
            onClick={handleConfirm}
            disabled={isLoading}
            className="border-border-strong hover:bg-background-hover"
          >
            {isLoading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            )}
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// =============================================================================
// Unified Modal Interface for backward compatibility
// =============================================================================

interface UnifiedModalProps {
  // Common props
  open?: boolean;
  isOpen?: boolean; // backward compatibility
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void; // backward compatibility

  // Content props
  title: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;

  // Footer props
  footer?: React.ReactNode;
}

const UnifiedModal: React.FC<UnifiedModalProps> = ({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}) => {
  // Normalize props for backward compatibility
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange =
    onOpenChange ??
    ((open: boolean) => {
      if (!open) onClose?.();
    });

  return (
    <Modal open={isModalOpen} onOpenChange={handleOpenChange}>
      <ModalContent size={size} showCloseButton={showCloseButton}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
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
  ModalPortal,
  AlertModal,
  ConfirmModal,
  UnifiedModal,
};

// Export types
export type { AlertModalProps, ConfirmModalProps, UnifiedModalProps };
