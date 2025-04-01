import React from 'react';

function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
      
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
          <p>
            This Privacy Policy explains how Boulevard Inc. ("we", "us", or "our") collects, uses, and protects your personal information when you use the SaaS Insight Engine ("the Service").
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Email address (for account creation and communication)</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Usage data and analytics</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide and maintain the Service</li>
            <li>Process your payments</li>
            <li>Send you important updates about the Service</li>
            <li>Improve and optimize the Service</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Storage and Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information. Your payment information is processed securely through Stripe, and we do not store your complete payment details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Stripe (for payment processing)</li>
            <li>Google Analytics (for usage tracking)</li>
            <li>Hosting providers (for service delivery)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Cookies</h2>
          <p>
            We use cookies to improve your experience and analyze service usage. You can control cookie preferences through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide the Service and comply with legal obligations. You can request deletion of your account at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Contact Us</h2>
          <p>
            For privacy-related questions or requests, please contact us at:
          </p>
          <p className="mt-2">
            Email: philipp.haus@icloud.com<br />
            Company: Boulevard Inc.
          </p>
        </section>

        <section className="mt-8 text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy; 