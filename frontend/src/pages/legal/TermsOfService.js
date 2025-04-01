import React from 'react';

function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service</h1>
      
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using the SaaS Insight Engine ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h2>
          <p>
            The SaaS Insight Engine provides access to a database of SaaS opportunities, market metrics, and a template generator for no-code platforms. The Service includes:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Access to curated SaaS ideas and market data</li>
            <li>Monthly template generation quota</li>
            <li>Platform-specific templates for no-code development</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Payment Terms</h2>
          <p>
            The Service requires a one-time payment of $30 for lifetime access. All payments are processed securely through Stripe. By making a payment, you agree to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide accurate payment information</li>
            <li>Authorize us to charge the specified amount</li>
            <li>Understand that payments are non-refundable unless required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. User Obligations</h2>
          <p>
            As a user of the Service, you agree to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide accurate information when registering</li>
            <li>Maintain the security of your account</li>
            <li>Not share your account credentials</li>
            <li>Use the Service in compliance with all applicable laws</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are the exclusive property of 4houses Ventures UG and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Limitation of Liability</h2>
          <p>
            The Service is provided "as is" without any warranties, either express or implied. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service. Continued use of the Service after such changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact Information</h2>
          <p>
            For any questions regarding these Terms of Service, please contact us at:
          </p>
          <p className="mt-2">
            Email: philipp.haus@icloud.com<br />
            Company: 4houses Ventures UG
          </p>
        </section>

        <section className="mt-8 text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  );
}

export default TermsOfService; 