// src/components/LightboxGallery.jsx
import * as React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function LightboxGallery({ open, onClose, images, startIndex = 0 }) {
  const slides = (images ?? []).map((src) => ({ src }));
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={startIndex}
      slides={slides}
      controller={{ closeOnBackdropClick: true }}
    />
  );
}
