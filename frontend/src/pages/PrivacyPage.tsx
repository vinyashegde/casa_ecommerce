import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    // ▼▼▼ THIS IS THE CRUCIAL LINE ▼▼▼
    // It MUST NOT contain "fixed" or "inset-0". 
    // This allows the page to display correctly inside your app's main layout.
    <div className="bg-gray-900 text-white min-h-screen">

      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      {/* Privacy Policy Content */}
      <div className="px-6 py-8 space-y-8 max-w-3xl mx-auto">
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            At Casa, your privacy is extremely important to us, and we are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Information We Collect</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            When you use our website, we may collect personal details such as your name, email, phone number, billing and shipping address, and payment information. Payments are processed securely by trusted third-party providers, and we do not store sensitive payment details on our servers. Additionally, we collect technical data such as IP addresses, browser types, and cookies to enhance user experience.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">How We Use Your Information</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            We use the information we collect for the following purposes: To process and deliver your orders. To communicate with you regarding your purchases, inquiries, or promotions. To improve our services, website functionality, and overall user experience. To comply with legal obligations and regulations.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Sharing Your Information</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            Your information may be shared with trusted partners who assist us in operating our business, such as delivery services, payment providers, and legal authorities when required by law. We will never sell or rent your personal data to third parties.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Cookies</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            Our website uses cookies to personalize your experience, analyze site traffic, and improve functionality. You have the option to disable cookies in your browser settings, though please be aware that some features of the site may not function properly as a result.
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Data Security</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            We employ industry-standard security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, please note that no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Your Rights</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            You have the right to access, update, or request the deletion of your personal data at any time. You can also opt out of marketing communications by following the unsubscribe instructions provided in our Emails.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Third-Party Websites</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            Our website may contain links to third-party sites. We are not responsible for the privacy practices of these external sites and encourage you to review their privacy policies.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Changes to This Policy</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            We may update this Privacy Policy periodically to reflect changes in our Practices or for other operational, legal, or regulatory reasons. Any changes will be posted here with the revised date.
          </p>
        </div>

        <div className="space-y-4 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-white">Contact Us</h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            If you have any questions regarding our Terms and Conditions or this Privacy Policy, please contact us using the details below.
          </p>
          <div className="text-gray-300 text-sm md:text-base space-y-2 mt-2">
             <p className="font-semibold text-white">Backitupfinancial Limited</p>
             <p><span className="font-medium text-gray-400">Email:</span> Casaofficial.43@gmail.com</p>
             <p><span className="font-medium text-gray-400">Phone:</span> +91 79001 16936</p>
             <p><span className="font-medium text-gray-400">Address:</span> Rajshree apt c wing 003 chakala Dewoolwadi Andheri East Mumbai 400099</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;