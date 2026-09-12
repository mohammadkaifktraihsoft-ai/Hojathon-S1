import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-4xl border border-transparent bg-clip-padding text-sm font-medium transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 min-h-[44px]",
  {
    variants: {
      variant: {
        default: "bg-teal-700 text-white shadow-sm hover:bg-teal-800 focus-visible:ring-teal-600",
        destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-600",
        outline:
          "border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:ring-teal-600",
        secondary:
          "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 focus-visible:ring-slate-400",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
        link: "text-teal-700 underline-offset-4 hover:underline focus-visible:ring-teal-600",
      },
      size: {
        default: "h-11 px-4 py-2",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-11 w-11",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ComponentProps<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

