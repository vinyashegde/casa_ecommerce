//Debug component to display user data vinyas!!!!

// import React from 'react';
// import { useUser } from '../contexts/UserContext';

// const UserDebug: React.FC = () => {
//   const { userData } = useUser();

//   // Only show in development
//   if (process.env.NODE_ENV !== 'development') {
//     return null;
//   }

//   return (
//     <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
//       <h3 className="font-bold mb-2">User Debug Info</h3>
//       <div className="space-y-1">
//         <div>Logged In: {userData.isLoggedIn ? 'Yes' : 'No'}</div>
//         <div>New User: {userData.isNewUser ? 'Yes' : 'No'}</div>
//         {userData.phoneNumber && (
//           <div>Phone: {userData.phoneNumber}</div>
//         )}
//         {userData.onboardingData && (
//           <div className="mt-2">
//             <div className="font-semibold">Onboarding Data:</div>
//             {userData.onboardingData.ageRange && (
//               <div>Age: {userData.onboardingData.ageRange}</div>
//             )}
//             {userData.onboardingData.styleInterests && (
//               <div>Styles: {userData.onboardingData.styleInterests.join(', ')}</div>
//             )}
//             {userData.onboardingData.preferredFits && (
//               <div>Fits: {userData.onboardingData.preferredFits.join(', ')}</div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserDebug;
