import React from "react";
import clsx from "clsx";

const wrapWipeText = (children: React.ReactNode) => {
    return React.Children.toArray(children).map((child, idx) => {
        if (typeof child === "string" || typeof child === "number") {
            const text = String(child);
            return (
                <span
                    key={`wipe-${idx}`}
                    className={clsx(
                        "btn-wipe inline-block align-middle",
                        // Smoother text wipe motion
                        "[transform:translateZ(0)]"
                    )}
                    aria-label={text}
                >
                    <span
                        className={clsx(
                            "btn-wipe-inner inline-block relative",
                            "will-change-transform"
                        )}
                    >
                        <span
                            className={clsx(
                                "btn-wipe-out inline-block",
                                "transition-transform duration-500",
                                "ease-[cubic-bezier(0.22,1,0.36,1)]",
                                "will-change-transform"
                            )}
                        >
                            {text}
                        </span>
                        <span
                            className={clsx(
                                "btn-wipe-in inline-block",
                                "transition-transform duration-500",
                                "ease-[cubic-bezier(0.22,1,0.36,1)]",
                                "will-change-transform"
                            )}
                            aria-hidden="true"
                        >
                            {text}
                        </span>
                    </span>
                </span>
            );
        }
        return <React.Fragment key={`node-${idx}`}>{child as any}</React.Fragment>;
    });
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "solid" | "outline";
    size?: "md" | "lg";
};

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = "solid",
    size = "md",
    ...rest
}) => {
    const base =
        "relative inline-flex items-center justify-center overflow-hidden rounded-full font-semibold focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-background transition-[transform,opacity,background-color,border-color,color] duration-300 ease-out will-change-transform";
    const sizes =
        size === "lg"
            ? "text-lg px-6 py-3 md:px-8 md:py-4 tracking-tight"
            : "text-sm px-4 py-2 tracking-tight";
    const variants =
        variant === "outline"
            ? "border border-gray-600 text-white bg-transparent hover:bg-white/5 active:bg-white/10"
            : "bg-gradient-primary text-white hover:opacity-95 active:opacity-90";

    return (
        <button
            className={clsx(
                "btn-wipe-trigger",
                "transition-transform",
                "active:scale-[0.98]",
                base,
                sizes,
                variants,
                className
            )}
            {...rest}
        >
            {wrapWipeText(children)}
        </button>
    );
};