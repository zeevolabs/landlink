import type { ReactNode } from "react";

export interface PreviewFrameProps {
  children: ReactNode;
}

export function PreviewFrame({ children }: PreviewFrameProps) {
  return (
    <div className="lla-preview">
      <div className="lla-preview-device">
        <div className="lla-preview-notch" />
        <div className="lla-preview-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
