import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Envelope from "../CashStuffingFeature/components/Envelope";
import { getEnvelopesForRoute } from "../lib/cashSync.js";
import { adjustAllocation } from "../lib/storage.js";
import { useParams, useNavigate } from "react-router-dom";

/* ----------------------------------------
   BILL CONFIG (largest → smallest)
---------------------------------------- */
const BILL_CONFIG = [
  { value: 100, src: "/100-clear.png" },
  { value: 50, src: "/50-clear.png" },
  { value: 20, src: "/20-clear.png" },
  { value: 10, src: "/10-clear.png" },
  { value: 5, src: "/5-clear.png" },
  { value: 1, src: "/1-clear.png" },
];

// Starting coordinates for bills
const BILL_START_POSITIONS = {
  100: { x: -480, y: 95 },
  50: { x: -490, y: 160 },
  20: { x: -476, y: 238 },
  10: { x: -490, y: 315 },
  5: { x: -475, y: 382 },
  1: { x: -488, y: 470 },
};

// Build bill animation sequence
function buildBillSequence(amount, direction) {
  let remaining = Math.floor(Math.abs(amount) || 0);
  const bills = [];

  for (const bill of BILL_CONFIG) {
    const count = Math.floor(remaining / bill.value);

    for (let i = 0; i < count; i++) {
      bills.push({
        id: `${direction}-${bill.value}-${Date.now()}-${bills.length}`,
        value: bill.value,
        src: bill.src,
        direction,
        startPos: BILL_START_POSITIONS[bill.value],
      });
    }

    remaining -= count * bill.value;
  }
  return bills;
}

export default function EnvelopePage() {
  const navigate = useNavigate();
  const { type, name } = useParams();

  const [envelopes, setEnvelopes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState("next");
  const [flippingFromIndex, setFlippingFromIndex] = useState(null);

  const [adjustMode, setAdjustMode] = useState(null);
  const [adjustValue, setAdjustValue] = useState("");

  const [billAnimations, setBillAnimations] = useState([]);

  /* -------------------------------
     Load envelopes on route change
  --------------------------------*/
  useEffect(() => {
    const envs = getEnvelopesForRoute(type, name);
    setEnvelopes(envs);
    setCurrentIndex(0);
    setIsFlipping(false);
    setFlippingFromIndex(null);
    setBillAnimations([]);
  }, [type, name]);

  /* -------------------------------
     Auto-clear flying bills
  --------------------------------*/
  useEffect(() => {
    if (billAnimations.length === 0) return;
    const totalDuration = 1400 + billAnimations.length * 200;
    const id = setTimeout(() => setBillAnimations([]), totalDuration);
    return () => clearTimeout(id);
  }, [billAnimations.length]);

  const hasEnvelopes = envelopes.length > 0;
  const imageSrc =
    type === "wallets" ? "/open-wallet-clear.png" : "/open-binder-clear.png";

  /* -------------------------------
       FLIP CONTROLS
  --------------------------------*/
  function showNext() {
    if (currentIndex >= envelopes.length - 1 || isFlipping) return;
    setFlipDirection("next");
    setFlippingFromIndex(currentIndex);
    setIsFlipping(true);
  }

  function showPrev() {
    if (currentIndex <= 0 || isFlipping) return;
    setFlipDirection("prev");
    setFlippingFromIndex(currentIndex);
    setIsFlipping(true);
  }

  function handleFlipComplete() {
    if (flippingFromIndex == null) return;

    setCurrentIndex(
      flipDirection === "next"
        ? flippingFromIndex + 1
        : flippingFromIndex - 1
    );

    setIsFlipping(false);
    setFlippingFromIndex(null);
  }

  /* -------------------------------
        CASH ADJUSTMENT
  --------------------------------*/
  function handleOpenAdjust(mode) {
    setAdjustMode(mode);
    setAdjustValue("");
  }

  function applyAdjustment() {
    const amt = Number(adjustValue);

    if (!amt || amt <= 0 || !hasEnvelopes) {
      setAdjustMode(null);
      setAdjustValue("");
      return;
    }

    const active = envelopes[currentIndex];
    if (!active) return;

    const signed = adjustMode === "plus" ? amt : -amt;

    adjustAllocation(active.name, signed);

    const updated = getEnvelopesForRoute(type, name);
    setEnvelopes(updated);

    setBillAnimations(buildBillSequence(amt, adjustMode));

    setAdjustMode(null);
    setAdjustValue("");
  }

  /* -------------------------------
        UNDER-ENVELOPE INDEX
  --------------------------------*/
  let underIndex = null;

  if (isFlipping && flippingFromIndex != null) {
    underIndex =
      flipDirection === "next"
        ? flippingFromIndex + 1
        : flippingFromIndex - 1;
  } else if (currentIndex < envelopes.length - 1) {
    underIndex = currentIndex + 1;
  }

  function capitalizeWords(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        paddingBottom: "4rem",
      }}
    >
      {/* BACK BUTTON */}
      <div
        style={{
          width: "100%",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <button
          className="btn secondary"
          onClick={() => navigate("/cash-stuffing")}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "10px",
            fontWeight: 600,
          }}
        >
          ← Back to Cash Stuffing Page
        </button>
      </div>

      {/* LAYOUT WRAPPER */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "100vh",
          background: "var(--bg)",
          gap: "5rem",
          padding: "2rem",
        }}
      >
        {/* CASH STACK */}
        <div style={{ marginTop: "5rem", textAlign: "center" }}>
          <img
            src="/cash-stack-clear.png"
            alt="cash"
            style={{
              position: "relative",
              left: "-140px",
              width: "300px",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* WALLET / BINDER VISUAL */}
        <div style={{ position: "relative", width: "420px" }}>
          <img
            src={imageSrc}
            alt="wallet"
            style={{
              width: "420px",
              height: "634px",
              objectFit: "contain",
              pointerEvents: "none",
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.18))",
            }}
          />

          {/* TITLE */}
          <h2
            style={{
              position: "absolute",
              top: "0px",
              left: "50%",
              transform: "translateX(-50%)",
              color: "var(--text)",
              fontSize: "1.7rem",
              fontWeight: 700,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {capitalizeWords(name?.replace(/-/g, " "))}
          </h2>

          {/* LEFT ARROW */}
          <button
            onClick={showPrev}
            disabled={currentIndex === 0 || isFlipping || !hasEnvelopes}
            style={{
              position: "absolute",
              top: "285px",
              left: "-40px",
              fontSize: "2rem",
              background: "transparent",
              border: "none",
              color: "var(--text)",
              opacity: currentIndex === 0 ? 0.3 : 1,
              cursor: currentIndex === 0 ? "default" : "pointer",
              zIndex: 9999,
            }}
          >
            ‹
          </button>

          {/* RIGHT ARROW */}
          <button
            onClick={showNext}
            disabled={
              currentIndex === envelopes.length - 1 ||
              isFlipping ||
              !hasEnvelopes
            }
            style={{
              position: "absolute",
              top: "285px",
              right: "-40px",
              fontSize: "2rem",
              background: "transparent",
              border: "none",
              color: "var(--text)",
              opacity:
                currentIndex === envelopes.length - 1 || !hasEnvelopes
                  ? 0.3
                  : 1,
              cursor:
                currentIndex === envelopes.length - 1
                  ? "default"
                  : "pointer",
              zIndex: 9999,
            }}
          >
            ›
          </button>

          {/* BILL ANIMATIONS */}
          <AnimatePresence>
            {billAnimations.map((bill, index) => (
              <motion.img
                key={bill.id}
                src={bill.src}
                alt={`${bill.value} dollar bill`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 215,
                  zIndex: 25,
                  pointerEvents: "none",
                }}
                initial={{
                  x: bill.startPos.x,
                  y: bill.startPos.y,
                  opacity: 0,
                }}
                animate={
                  bill.direction === "plus"
                    ? {
                        x: [bill.startPos.x, 120, 100],
                        y: [bill.startPos.y, 380, 150],
                        opacity: [0, 1, 1],
                      }
                    : {
                        x: [100, 120, bill.startPos.x],
                        y: [150, 380, bill.startPos.y],
                        opacity: [0, 1, 1],
                      }
                }
                exit={{ opacity: 0 }}
                transition={{
                  duration: 4.3,
                  ease: "easeInOut",
                  delay: index * 0.12,
                }}
              />
            ))}
          </AnimatePresence>

          {/* UNDER ENVELOPE */}
          {underIndex != null && envelopes[underIndex] && (
            <div
              style={{
                position: "absolute",
                top: "170px",
                left: "53%",
                transform: "translateX(-50%)",
                width: "270px",
                height: "165px",
                opacity: 0.95,
                zIndex: 20,
              }}
            >
              <Envelope
                label={envelopes[underIndex].name}
                amount={envelopes[underIndex].remaining}
                flat
                onOpenAdjust={handleOpenAdjust}
              />
            </div>
          )}

          {/* FRONT ENVELOPE */}
          <div
            style={{
              position: "absolute",
              top: "170px",
              left: "53%",
              transform: "translateX(-50%)",
              width: "270px",
              height: "165px",
              zIndex: 40,
            }}
          >
            {isFlipping && flippingFromIndex != null ? (
              <Envelope
                label={envelopes[flippingFromIndex].name}
                amount={envelopes[flippingFromIndex].remaining}
                flipping
                flipDirection={flipDirection}
                onFlipComplete={handleFlipComplete}
                onOpenAdjust={handleOpenAdjust}
              />
            ) : (
              hasEnvelopes && (
                <Envelope
                  label={envelopes[currentIndex].name}
                  amount={envelopes[currentIndex].remaining}
                  flat
                  onOpenAdjust={handleOpenAdjust}
                />
              )
            )}
          </div>

          {/* OVERLAY */}
          {adjustMode && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)",
                zIndex: 1500,
              }}
              onClick={() => setAdjustMode(null)}
            />
          )}

          {/* MONEY INPUT POPUP */}
          {adjustMode && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "var(--card)",
                padding: "1.7rem",
                borderRadius: "16px",
                boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                zIndex: 2000,
                width: "280px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <input
                type="number"
                className="input"
                placeholder="Amount"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              />

              <button className="btn" onClick={applyAdjustment}>
                Apply
              </button>

              <button
                className="btn danger"
                onClick={() => setAdjustMode(null)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
