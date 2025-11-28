/* eslint-disable @typescript-eslint/no-explicit-any */
/* global google */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from '../contexts/UserContext'; // Import the useUser hook

/* -------------------------------- Config -------------------------------- */
const API_BASE = import.meta.env.VITE_API_URL;

/* -------- Google Maps: robust loader (base + places via importLibrary) --- */
let mapsBasePromise: Promise<void> | null = null;

function ensureMapsBase(apiKey: string): Promise<void> {
  const w = window as any;
  if (w.google?.maps) return Promise.resolve();
  if (!mapsBasePromise) {
    mapsBasePromise = new Promise((resolve, reject) => {
      if (!apiKey) return reject(new Error("Google Maps API key missing."));
      const s = document.createElement("script");
      s.id = "google-maps-script";
      s.async = true;
      s.defer = true;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Google Maps script."));
      document.head.appendChild(s);
    });
  }
  return mapsBasePromise;
}

async function loadGoogleMaps(apiKey: string): Promise<void> {
  const w = window as any;
  await ensureMapsBase(apiKey);
  try {
    if (!w.google?.maps?.places) {
      await w.google.maps.importLibrary("places");
    }
  } catch {
    throw new Error(
      "Places library isn’t available. Enable the Places API for your key."
    );
  }
}

/* ----------------------------- Helpers/Types ----------------------------- */
type AddressComponents = google.maps.GeocoderAddressComponent[];
const getComp = (comps: AddressComponents, type: string) =>
  comps.find((c) => c.types.includes(type));

function parseAddressComponents(place: google.maps.places.PlaceResult) {
  const comps = (place.address_components || []) as AddressComponents;

  const city =
    getComp(comps, "locality")?.long_name ||
    getComp(comps, "postal_town")?.long_name ||
    getComp(comps, "administrative_area_level_2")?.long_name ||
    "";

  const state = getComp(comps, "administrative_area_level_1")?.long_name || "";
  const pincode = getComp(comps, "postal_code")?.long_name || "";
  const country =
    getComp(comps, "country")?.long_name ||
    getComp(comps, "country")?.short_name ||
    "India";

  const route = getComp(comps, "route")?.long_name || "";
  const streetNumber = getComp(comps, "street_number")?.long_name || "";
  const sublocality =
    getComp(comps, "sublocality_level_1")?.long_name ||
    getComp(comps, "sublocality")?.long_name ||
    "";

  const formatted =
    place.formatted_address ||
    [`${streetNumber} ${route}`.trim(), sublocality, city]
      .filter(Boolean)
      .join(", ");

  return { city, state, pincode, country, formatted };
}

const isGmail = (v: string) => /^[^\s@]+@gmail\.com$/.test(v.trim());
const isIndianPhone = (v: string) => /^\d{10}$/.test(v.trim());
const isPincode = (v: string) => /^\d{6}$/.test(v.trim());
const isRequired = (v: string) => v.trim().length > 0;

interface DeliveryAddress {
  fullName: string;
  phone: string;
  email: string;
  addressSearch: string;
  addressLine: string;
  flatNumber: string;
  wingBuilding: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const defaults: DeliveryAddress = {
  fullName: "",
  phone: "",
  email: "",
  addressSearch: "",
  addressLine: "",
  flatNumber: "",
  wingBuilding: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

type Step = 1 | 2 | 3 | 4;

/* =============================== Component =============================== */
const LocationPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser(); // Access user data from context
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  const [loadingMaps, setLoadingMaps] = useState(true);
  const [mapsError, setMapsError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<DeliveryAddress>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [query, setQuery] = useState("");
  const [preds, setPreds] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showList, setShowList] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);

  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(
    null
  );
  const detailsRef = useRef<google.maps.places.PlacesService | null>(null);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const finalAddress = useMemo(() => {
    return [
      [form.flatNumber, form.wingBuilding].filter(Boolean).join(" "),
      form.addressLine || form.addressSearch,
      [form.city, form.state].filter(Boolean).join(", "),
      form.pincode,
      form.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [form]);

  /* ------------------------------- Load Maps ------------------------------ */
  useEffect(() => {
    let mounted = true;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!mounted) return;
        setLoadingMaps(false);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setMapsError(
          err?.message ||
            "Failed to load Google Maps. Check API key, billing, and that Places API is enabled."
        );
        setLoadingMaps(false);
      });
    return () => {
      mounted = false;
    };
  }, [apiKey]);

  useEffect(() => {
    if (loadingMaps || mapsError) return;
    const w = window as any;
    if (!w.google?.maps?.places) return;

    if (!serviceRef.current) {
      serviceRef.current = new w.google.maps.places.AutocompleteService();
    }
    if (!detailsRef.current) {
      detailsRef.current = new w.google.maps.places.PlacesService(
        document.createElement("div")
      );
    }
    tokenRef.current = new w.google.maps.places.AutocompleteSessionToken();
  }, [loadingMaps, mapsError]);

  useEffect(() => {
    if (!serviceRef.current) return;
    if (!query || query.trim().length < 2) {
      setPreds([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      serviceRef.current!.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: ["in"] },
          sessionToken: tokenRef.current || undefined,
        } as google.maps.places.AutocompletionRequest,
        (results) => {
          setPreds(results || []);
          setShowList(true);
          setHighlight(-1);
        }
      );
    }, 180);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pickPrediction = (p: google.maps.places.AutocompletePrediction) => {
    if (!detailsRef.current) return;
    detailsRef.current.getDetails(
      {
        placeId: p.place_id!,
        fields: ["address_components", "formatted_address", "geometry", "name"],
        sessionToken: tokenRef.current || undefined,
      },
      (place, status) => {
        const ok = (window as any).google.maps.places.PlacesServiceStatus.OK;
        if (!place || status !== ok) return;
        const parsed = parseAddressComponents(place);
        setForm((f) => ({
          ...f,
          addressSearch: p.description || place.formatted_address || "",
          addressLine: parsed.formatted || p.description || "",
          city: parsed.city,
          state: parsed.state,
          pincode: parsed.pincode,
          country: parsed.country || "India",
        }));
        setQuery(p.description || "");
        setShowList(false);
        setPreds([]);
        tokenRef.current = new (
          window as any
        ).google.maps.places.AutocompleteSessionToken();
      }
    );
  };

  /* --------------------------------- Form -------------------------------- */
  const update = (key: keyof DeliveryAddress, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validateStep = (s: Step): boolean => {
    const e: Record<string, string> = {};
    if (s === 1 && !isRequired(form.addressSearch)) {
      e.addressSearch = "Pick an address or type manually";
    }
    if (s === 2) {
      if (!form.flatNumber.trim()) e.flatNumber = "Flat/House number required";
      if (!form.wingBuilding.trim()) e.wingBuilding = "Wing/Building required";
      if (!form.city.trim()) e.city = "City required";
      if (!form.state.trim()) e.state = "State required";
      if (!isPincode(form.pincode)) e.pincode = "6-digit pincode required";
      if (!form.country.trim()) e.country = "Country required";
    }
    if (s === 3) {
      if (!isRequired(form.fullName)) e.fullName = "Full name required";
      if (!isIndianPhone(form.phone))
        e.phone = "Must be a 10-digit phone number";
      if (!isGmail(form.email)) e.email = "Must be a valid @gmail.com address";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSave = useMemo(() => {
    return (
      isRequired(form.fullName) &&
      isIndianPhone(form.phone) &&
      isGmail(form.email) &&
      form.flatNumber.trim().length > 0 &&
      form.wingBuilding.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.state.trim().length > 0 &&
      isPincode(form.pincode) &&
      isRequired(form.country) &&
      isRequired(form.addressSearch)
    );
  }, [form]);

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => (s === 4 ? 4 : ((s + 1) as Step)));
  };
  const back = () => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)));

  /* --------------------------------- Save -------------------------------- */
  const handleSave = async () => {
    if (!canSave) return;
    const userId = userData?._id;
    if (!userId) {
      alert("Please log in to save your address.");
      return;
    }

    try {
      const payload = {
        billing_customer_name: form.fullName,
        billing_phone: form.phone,
        billing_email: form.email,
        billing_address: `${form.flatNumber} ${form.wingBuilding}`.trim(),
        billing_address_2: form.addressLine || form.addressSearch,
        billing_city: form.city,
        billing_pincode: String(form.pincode),
        billing_state: form.state,
        billing_country: form.country,
      };

      await axios.post(`${API_BASE}/users/${userId}/shipment`, payload, {
        withCredentials: false,
      });

      navigate(-1);
    } catch (err) {
      console.error("❌ Could not save address", err);
      alert("Could not save address. Please try again.");
    }
  };

  /* ---------------------------------- UI --------------------------------- */
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm opacity-70 hover:opacity-100"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold">Delivery Details</h1>
          <div className="text-sm opacity-70">Step {step}/4</div>
        </div>

        {/* Step 1: Rich search with MANY predictions */}
        {step === 1 && (
          <div className="bg-gray-900 rounded-2xl p-4 shadow-lg relative">
            <h2 className="text-base font-medium mb-3 opacity-90">
              Locate Your Address
            </h2>

            <label className="text-sm opacity-80 mb-2 block">
              Search Address
            </label>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => preds.length && setShowList(true)}
              onBlur={() => setTimeout(() => setShowList(false), 120)}
              onKeyDown={(e) => {
                if (!showList || preds.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => Math.min(h + 1, preds.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter" && highlight >= 0) {
                  e.preventDefault();
                  pickPrediction(preds[highlight]);
                }
              }}
              placeholder="Type your location (e.g., Andheri East)…"
              disabled={loadingMaps || !!mapsError}
              className="flex-1 h-10 w-full rounded-full bg-gradient-to-br from-[#DAE8F7] to-[#D6E5F7] text-gray-900 placeholder-gray-500 px-3 outline-none text-[15px]"
            />
            {loadingMaps && (
              <p className="text-xs mt-2 opacity-70">Loading maps…</p>
            )}
            {mapsError && (
              <p className="text-xs mt-2 text-red-400">
                {mapsError} You can still type your address manually in the next
                step.
              </p>
            )}
            {errors.addressSearch && (
              <p className="text-xs text-red-400 mt-1">
                {errors.addressSearch}
              </p>
            )}

            {showList && preds.length > 0 && (
              <div className="absolute z-20 mt-2 w-[calc(100%-2rem)] max-h-72 overflow-y-auto rounded-xl bg-gray-800/95 backdrop-blur border border-gray-700 shadow-xl">
                {preds.map((p, i) => (
                  <button
                    key={p.place_id}
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickPrediction(p)}
                    className={`block w-full text-left px-3 py-2 hover:bg-gray-700 ${
                      i === highlight ? "bg-gray-700" : ""
                    }`}
                  >
                    <div className="text-sm text-white">
                      {p.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-400">
                      {p.structured_formatting.secondary_text || p.description}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {form.addressLine && (
              <p className="text-sm opacity-80 mt-3">
                <span className="opacity-60">Detected:</span> {form.addressLine}
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setForm((f) => ({
                    ...f,
                    addressSearch: query || f.addressSearch,
                  }));
                  setStep(2);
                }}
                className="flex-1 rounded-xl px-4 py-3 font-semibold bg-indigo-600 hover:bg-indigo-500"
              >
                Next: Address Fields
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address fields */}
        {step === 2 && (
          <div className="bg-gray-900 rounded-2xl p-4 shadow-lg">
            <h2 className="text-base font-medium mb-3 opacity-90">
              Address Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-sm opacity-80">Flat / House No. *</label>
                <input
                  value={form.flatNumber}
                  onChange={(e) => update("flatNumber", e.target.value)}
                  placeholder="eg: 705"
                  className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.flatNumber && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.flatNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm opacity-80">Wing / Building *</label>
                <input
                  value={form.wingBuilding}
                  onChange={(e) => update("wingBuilding", e.target.value)}
                  placeholder="eg: A Wing"
                  className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.wingBuilding && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.wingBuilding}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm opacity-80">City *</label>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.city && (
                  <p className="text-xs text-red-400 mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <label className="text-sm opacity-80">State *</label>
                <input
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.state && (
                  <p className="text-xs text-red-400 mt-1">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-sm opacity-80">Pincode *</label>
                <input
                  value={form.pincode}
                  onChange={(e) => update("pincode", e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.pincode && (
                  <p className="text-xs text-red-400 mt-1">{errors.pincode}</p>
                )}
              </div>
              <div>
                <label className="text-sm opacity-80">Country *</label>
                <input
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.country && (
                  <p className="text-xs text-red-400 mt-1">{errors.country}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={back}
                className="flex-1 rounded-xl px-4 py-3 font-semibold bg-gray-800 hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-1 rounded-xl px-4 py-3 font-semibold bg-indigo-600 hover:bg-indigo-500"
              >
                Next: Contact Info
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="bg-gray-900 rounded-2xl p-4 shadow-lg">
            <h2 className="text-base font-medium mb-3 opacity-90">
              Contact Information
            </h2>

            <div className="grid gap-3">
              <div>
                <label className="text-sm opacity-80">Full Name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="eg: John Doe"
                  className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm opacity-80">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm opacity-80">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@gmail.com"
                    className="mt-1 w-full rounded-xl bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={back}
                className="flex-1 rounded-xl px-4 py-3 font-semibold bg-gray-800 hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-1 rounded-xl px-4 py-3 font-semibold bg-indigo-600 hover:bg-indigo-500"
              >
                Review & Confirm
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="bg-gray-900 rounded-2xl p-4 shadow-lg">
            <h2 className="text-base font-medium mb-4 opacity-90">
              Review Address
            </h2>

            <div className="mb-4">
              <div className="opacity-70 text-sm mb-1">Final Address</div>
              <div className="bg-gray-800 rounded-xl p-3 text-sm">
                {finalAddress}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="opacity-70">Flat / House No.</div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    {form.flatNumber || "-"}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Wing / Building</div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    {form.wingBuilding || "-"}
                  </div>
                </div>
              </div>

              <div>
                <div className="opacity-70">Searched / Street Address</div>
                <div className="bg-gray-800 rounded-xl p-3">
                  {form.addressLine || form.addressSearch || "-"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="opacity-70">City</div>
                  <div className="bg-gray-800 rounded-xl p-3">{form.city}</div>
                </div>
                <div>
                  <div className="opacity-70">State</div>
                  <div className="bg-gray-800 rounded-xl p-3">{form.state}</div>
                </div>
                <div>
                  <div className="opacity-70">Pincode</div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    {form.pincode}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Country</div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    {form.country}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="opacity-70">Full Name</div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    {form.fullName}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Phone</div>
                  <div className="bg-gray-800 rounded-xl p-3">{form.phone}</div>
                </div>
                <div className="col-span-2">
                  <div className="opacity-70">Email</div>
                  <div className="bg-gray-800 rounded-xl p-3">{form.email}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={back}
                className="flex-1 rounded-xl px-4 py-3 font-semibold bg-gray-800 hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`flex-1 rounded-xl px-4 py-3 font-semibold ${
                  canSave
                    ? "bg-indigo-600 hover:bg-indigo-500"
                    : "bg-gray-700 cursor-not-allowed opacity-60"
                }`}
              >
                Save & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPage;