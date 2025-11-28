// // components/LocationSection.tsx
// import React, { useState, useEffect } from "react";

// const LocationSection = () => {
//   const [address, setAddress] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showForm, setShowForm] = useState(false);
//   const [formData, setFormData] = useState({
//     flat: "",
//     wing: "",
//     landmark: "",
//   });

//   useEffect(() => {
//     console.log("📦 LocationSection mounted");
//   }, []);

//   const handleClick = () => {
//     console.log("📍 Delivery clicked");
//     setLoading(true);

//     if (!navigator.geolocation) {
//       alert("Geolocation is not supported by your browser");
//       setLoading(false);
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         console.log("✅ Location fetched:", position.coords);

//         const { latitude, longitude } = position.coords;

//         const apiKey = "AIzaSyAHUYOhT1nlx85i9r4xCZsRUIkKchAxCsk"; // Replace this with your real key
//         const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

//         try {
//           const res = await fetch(url);
//           const data = await res.json();
//           console.log("📍 Geocoding data:", data);

//           if (data.status === "OK" && data.results.length > 0) {
//             const result = data.results[0].formatted_address;
//             setAddress(result);
//           } else {
//             setAddress("Location found, but couldn't resolve address.");
//           }
//         } catch (err) {
//           console.error("❌ Geocoding fetch error:", err);
//           setAddress("Error fetching address. Please try again.");
//         }

//         setShowForm(true);
//         setLoading(false);
//       },
//       (err) => {
//         console.error("❌ Location error:", err);
//         if (err.code === 1) {
//           alert("❌ Location permission denied. Please allow it in browser settings.");
//         } else {
//           alert(`Location error: ${err.message}`);
//         }
//         setLoading(false);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="p-4 max-w-md mx-auto">
//       <div
//         className="text-blue-600 underline cursor-pointer font-semibold"
//         onClick={handleClick}
//       >
//         {loading ? "Fetching location..." : "Delivery in 60 min"}
//       </div>

//       {address && (
//         <div className="mt-3 text-gray-700 font-medium">{address}</div>
//       )}

//       {showForm && (
//         <div className="mt-4 space-y-3">
//           <input
//             type="text"
//             name="flat"
//             placeholder="Flat / House No."
//             className="w-full border p-2 rounded"
//             value={formData.flat}
//             onChange={handleChange}
//           />
//           <input
//             type="text"
//             name="wing"
//             placeholder="Wing / Building"
//             className="w-full border p-2 rounded"
//             value={formData.wing}
//             onChange={handleChange}
//           />
//           <input
//             type="text"
//             name="landmark"
//             placeholder="Landmark"
//             className="w-full border p-2 rounded"
//             value={formData.landmark}
//             onChange={handleChange}
//           />

//           <button
//             className="bg-black text-white px-4 py-2 rounded w-full"
//             onClick={() => {
//               const savedAddress = { ...formData, fullAddress: address };
//               console.log("✅ Saved Address:", savedAddress);
//               alert("Address Saved ✅");
//             }}
//           >
//             Save Address
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LocationSection;
