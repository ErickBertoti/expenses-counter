"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Drawer({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/18 backdrop-blur-[2px]",
        "transition-opacity duration-200 ease-out",
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex items-end justify-center px-2",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
        )}
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          className={cn(
            "w-full max-w-xl outline-none",
            "transition-[transform,opacity] duration-200 ease-out",
            "data-[starting-style]:translate-y-6 data-[starting-style]:opacity-0",
            "data-[ending-style]:translate-y-6 data-[ending-style]:opacity-0",
            "motion-reduce:transition-none",
            className
          )}
          {...props}
        >
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              "relative flex max-h-[min(calc(100dvh-0.5rem),52rem)] min-h-0 flex-col overflow-hidden",
              "rounded-[28px] border border-border/70 bg-background/98 shadow-2xl shadow-foreground/10",
              "supports-[padding:max(0px)]:pb-0"
            )}
          >
            <div
              aria-hidden="true"
              className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border"
            />
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  )
}

function DrawerHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex items-start justify-between gap-3 border-b border-border/70 px-4 pb-4 pt-3",
        className
      )}
      {...props}
    />
  )
}

function DrawerHeading({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-heading"
      className={cn("min-w-0 flex-1 space-y-1", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-heading text-lg font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DrawerBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4",
        "[-webkit-overflow-scrolling:touch]",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "shrink-0 border-t border-border/70 bg-background/95 px-4 pt-3",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        className
      )}
      {...props}
    />
  )
}

function DrawerClose({
  className,
  children,
  ...props
}: DrawerPrimitive.Close.Props) {
  return (
    <DrawerPrimitive.Close
      data-slot="drawer-close"
      className={cn(
        buttonVariants({
          variant: "ghost",
          size: "icon-sm",
        }),
        "shrink-0 touch-manipulation",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <XIcon aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </>
      )}
    </DrawerPrimitive.Close>
  )
}

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerHeading,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
}
