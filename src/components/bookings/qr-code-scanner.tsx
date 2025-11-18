import React, { useState, useRef } from "react";
import { OnResultFunction, QrReader } from "react-qr-reader";

const QRCodeScanner = ({
  onScanSuccess,
}: {
  onScanSuccess: (x: string) => void;
}) => {
  const [scannedData, setScannedData] = useState<string>();
  const [error, setError] = useState<string>();
  const hasScannedRef = useRef(false);

  const handleScan: OnResultFunction = (result, error) => {
    if (result && !hasScannedRef.current) {
      hasScannedRef.current = true; // Prevent further scans

      setError("");
      const scannedText = result?.getText();
      setScannedData(scannedText);
      const bookingId = scannedText;
      onScanSuccess(bookingId);
    }

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <p style={styles.subtitle}>
          Position the QR code within the camera frame
        </p>
      </div>

      <div style={styles.scannerWrapper}>
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: "environment" }}
          containerStyle={styles.qrReader}
          videoContainerStyle={styles.videoContainer}
          videoStyle={styles.video}
        />
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
  qrReader: {
    width: "100%",
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
