"use client";

import React from "react";
import GlobalMediaUploader, { MediaPresets } from "../components/GlobalMediaUploader";

type MediaFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  recommended?: string;
  ratio?: string;
  formats?: string;
  maxSizeMB?: number;
  isVideo?: boolean;
  multiple?: boolean;
  layout?: "square" | "wide" | "tall" | "free";
  compact?: boolean;
  preset?: MediaPresets;
};

export default function MediaField({
  label,
  value,
  onChange,
  folder = "general",
  isVideo = false,
  compact = false,
  preset = "general",
}: MediaFieldProps) {
  return (
    <GlobalMediaUploader
      label={label}
      value={value}
      onChange={(v) => onChange(typeof v === "string" ? v : (Array.isArray(v) && v.length > 0 ? (typeof v[0] === "string" ? v[0] : v[0].url) : ""))}
      folder={folder}
      allowVideo={isVideo || preset === "product_video" || preset === "banner_desktop" || preset === "testimonial" || preset === "blog_featured"}
      compact={compact}
      preset={preset}
      multiple={false}
    />
  );
}
