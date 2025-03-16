"use client";

import { useState } from "react";
import { Button, Input, Card, Text, Loader } from "@mantine/core";

export default function BinTestPage() {
  const [bin, setBin] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!bin || bin.length < 6) {
      setError("BIN must be at least 6 digits");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bin-lookup?bin=${bin}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("BIN lookup error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <h1>BIN Lookup Test</h1>
      <p>Enter a BIN (first 6 digits of a card number) to test the API</p>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Input
          placeholder="Enter BIN (e.g., 411111)"
          value={bin}
          onChange={(e) => setBin(e.currentTarget.value)}
          style={{ flexGrow: 1 }}
        />
        <Button onClick={handleLookup} loading={loading}>
          Lookup
        </Button>
      </div>
      
      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>
          {error}
        </div>
      )}
      
      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Loader size="md" />
          <Text>Looking up BIN information...</Text>
        </div>
      )}
      
      {result && !loading && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <h2>BIN Information</h2>
          <pre style={{ background: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          
          <div style={{ marginTop: "20px" }}>
            <p><strong>Bank:</strong> {result.bank || "Unknown"}</p>
            <p><strong>Scheme:</strong> {result.scheme || "Unknown"}</p>
            <p><strong>Type:</strong> {result.type || "Unknown"}</p>
            <p><strong>Category:</strong> {result.category || "Unknown"}</p>
            <p><strong>Country:</strong> {result.country || "Unknown"}</p>
          </div>
        </Card>
      )}
      
      <div style={{ marginTop: "40px" }}>
        <h3>Test BINs</h3>
        <ul>
          <li><strong>Visa:</strong> 411111, 414720, 456789</li>
          <li><strong>Mastercard:</strong> 510000, 520000, 530000, 540000, 550000</li>
          <li><strong>Amex:</strong> 340000, 370000</li>
          <li><strong>Discover:</strong> 601100, 650000</li>
          <li><strong>JCB:</strong> 350000</li>
          <li><strong>Diners Club:</strong> 300000, 360000, 380000</li>
          <li><strong>Maestro:</strong> 630400, 675900</li>
        </ul>
      </div>
    </div>
  );
} 