import React from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      key="privacy-policy"
      className="pt-32 px-6 lg:px-12 pb-20 max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <Shield className="w-8 h-8 text-indigo-400" />
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      </div>
      <div className="prose prose-invert prose-indigo max-w-none space-y-6">
        <p className="text-white/70">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Introduction</h2>
        <p className="text-white/80">
          Welcome to Cinephile. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you as to how we look after your personal data when you visit our 
          website and tell you about your privacy rights and how the law protects you.
        </p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. The Data We Collect About You</h2>
        <p className="text-white/80">
          Personal data, or personal information, means any information about an individual from which that person can be identified.
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul className="list-disc pl-6 text-white/80 space-y-2">
          <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
          <li><strong>Contact Data</strong> includes email address.</li>
          <li><strong>Profile Data</strong> includes your username and password, your interests, preferences, feedback and survey responses.</li>
          <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
        </ul>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. How We Use Your Personal Data</h2>
        <p className="text-white/80">
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </p>
        <ul className="list-disc pl-6 text-white/80 space-y-2">
          <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
          <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
          <li>Where we need to comply with a legal obligation.</li>
        </ul>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Data Security</h2>
        <p className="text-white/80">
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Your Legal Rights</h2>
        <p className="text-white/80">
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Contact Us</h2>
        <p className="text-white/80">
          If you have any questions about this privacy policy or our privacy practices, please contact us at:
        </p>
        <p className="text-white/60 italic mt-2">[Contact Information Placeholder]</p>
      </div>
    </motion.div>
  );
}
