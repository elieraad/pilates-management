"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

const QRCodeScanner = ({
  onScanSuccess,
}: {
  onScanSuccess: (x: string) => void;
}) => {
  const [scannedData, setScannedData] = useState<string>();
  const [error, setError] = useState<string>();
  const hasScannedRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const reader = new BrowserQRCodeReader();

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err, controls) => {
          controlsRef.current = controls;

          if (result && !hasScannedRef.current) {
            hasScannedRef.current = true;

            const text = result.getText();
            setScannedData(text);
            setError("");

            onScanSuccess(text);

            controls?.stop(); // Stop scanning after success
          }

          if (err) {
            setError(err.message);
          }
        }
      )
      .catch((e) => setError(e.message));

    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <p style={styles.subtitle}>
          Position the QR code within the camera frame
        </p>
      </div>

      <div style={styles.scannerWrapper}>
        <div style={styles.videoContainer}>
          <video ref={videoRef} style={styles.video} />
        </div>
      </div>

      {scannedData && (
        <div style={styles.successBox}>
          <p style={styles.successText}>✓ Scanned: {scannedData}</p>
          <p style={styles.redirectText}>Redirecting...</p>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>Error: {error}</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    marginBottom: "20px",
  },
  subtitle: {
    margin: "0",
    color: "#666",
    fontSize: "14px",
  },
  scannerWrapper: {
    maxWidth: "500px",
    margin: "0 auto",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  videoContainer: {
    paddingTop: "100%",
    position: "relative" as const,
  },
  video: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  successBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#d4edda",
    border: "1px solid #c3e6cb",
    borderRadius: "4px",
  },
  successText: {
    margin: "5px 0",
    color: "#155724",
    fontWeight: "bold" as const,
  },
  redirectText: {
    margin: "5px 0",
    color: "#155724",
  },
  errorBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#f8d7da",
    border: "1px solid #f5c6cb",
    borderRadius: "4px",
  },
  errorText: {
    margin: "0",
    color: "#721c24",
  },
};

export default QRCodeScanner;
