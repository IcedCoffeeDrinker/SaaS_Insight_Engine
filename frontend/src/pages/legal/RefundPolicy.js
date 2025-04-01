import React from 'react';

function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Refund Policy</h1>
      
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Overview</h2>
          <p>
            This Refund Policy outlines the terms and conditions for refunds of the SaaS Insight Engine service. We aim to be fair and transparent in our refund process.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Digital Product Nature</h2>
          <p>
            The SaaS Insight Engine is a digital product that provides immediate access to our database and services. Due to the nature of digital products, refunds are generally not available once access has been granted.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Refund Eligibility</h2>
          <p>Refunds may be considered in the following circumstances:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Technical issues preventing access to the service</li>
            <li>Billing errors or duplicate charges</li>
            <li>Legal requirements in your jurisdiction</li>
            <li>Service unavailability exceeding 24 hours</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Non-Refundable Items</h2>
          <p>The following are not eligible for refunds:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Change of mind or buyer's remorse</li>
            <li>Failure to use the service</li>
            <li>Personal preference or compatibility issues</li>
            <li>Partial refunds for unused features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Refund Process</h2>
          <p>If you believe you are eligible for a refund:</p>
          <ol className="list-decimal pl-6 mt-2 space-y-1">
            <li>Contact us at philipp.haus@icloud.com</li>
            <li>Provide your account email and order details</li>
            <li>Explain the reason for your refund request</li>
            <li>We will review your request within 2 business days</li>
            <li>If approved, refunds will be processed through Stripe</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Processing Time</h2>
          <p>
            Approved refunds will be processed within 5-10 business days. The time it takes for the refund to appear in your account depends on your payment method and financial institution.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Account Access</h2>
          <p>
            If a refund is approved, your account access will be terminated immediately. You will need to make a new purchase to regain access to the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact Information</h2>
          <p>
            For refund requests or questions about this policy, please contact us at:
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

export default RefundPolicy; 