import { Field } from "@decky/ui";
import { FC, ReactNode, useLayoutEffect, useRef, useState } from "react";

const fullWidthFieldScopeClassName = "dc-full-width-field-scope";
let cachedChildrenContainerClass: string | undefined;

const escapeCssClass = (value: string) => {
  if (window.CSS && "escape" in window.CSS) {
    return window.CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
};

export interface FullWidthFieldScopeProps {
  children?: ReactNode;
  className?: string;
}

export const FullWidthFieldScope: FC<FullWidthFieldScopeProps> = ({
  children,
  className,
}) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const [childrenContainerClass, setChildrenContainerClass] = useState<string | undefined>(
    cachedChildrenContainerClass
  );

  useLayoutEffect(() => {
    if (cachedChildrenContainerClass) {
      setChildrenContainerClass(cachedChildrenContainerClass);
      return;
    }

    const field = fieldRef.current;
    const marker = markerRef.current;
    if (!field || !marker) {
      return;
    }

    let node: HTMLElement | null = marker;
    while (node.parentElement && node.parentElement !== field) {
      node = node.parentElement;
    }

    if (!node || node.parentElement !== field) {
      return;
    }

    const containerClass = Array.from(node.classList).find(
      (item) => item !== "Panel" && item !== "Focusable"
    );

    if (containerClass) {
      cachedChildrenContainerClass = containerClass;
      setChildrenContainerClass(containerClass);
    }
  }, []);

  return (
    <div className={`${fullWidthFieldScopeClassName}${className ? ` ${className}` : ""}`}>
      <div style={{ display: "none" }}>
        <Field ref={fieldRef} label="">
          <span ref={markerRef} />
        </Field>
      </div>
      {childrenContainerClass && (
        <style>
          {`
.${escapeCssClass(fullWidthFieldScopeClassName)} .${escapeCssClass(childrenContainerClass)} {
  max-width: none !important;
}
          `}
        </style>
      )}
      {children}
    </div>
  );
};
