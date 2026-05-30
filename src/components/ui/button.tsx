import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-[#0f274d] text-white hover:bg-[#16325f] hover:shadow-md",
        destructive: "bg-[#c3222a] text-white hover:bg-[#a71d24] hover:shadow-md",
        outline: "border border-[#d9e2ef] bg-white text-[#0f274d] hover:border-[#0f274d] hover:bg-[#f4f7fb]",
        secondary: "bg-[#c3222a] text-white hover:bg-[#a71d24] hover:shadow-md",
        ghost: "bg-transparent text-[#0f274d] shadow-none hover:bg-[#f4f7fb]",
        link: "bg-transparent text-[#0f274d] shadow-none underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
