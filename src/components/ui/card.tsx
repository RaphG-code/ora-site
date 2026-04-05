import React from "react";
import clsx from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ className, ...rest }) => {
    return (
        <div
            className={clsx(
                "rounded-2xl border border-border bg-black/40 backdrop-blur-sm",
                className
            )}
            {...rest}
        />
    );
};