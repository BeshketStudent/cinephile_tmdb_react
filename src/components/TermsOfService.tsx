import React from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      key="terms-of-service"
      className="pt-32 px-6 lg:px-12 pb-20 max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <FileText className="w-8 h-8 text-rose-400" />
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      </div>
      <div className="prose prose-invert prose-rose max-w-none space-y-6">
        <p className="text-white/70">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="text-white/80">
          By accessing and using Cinephile ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Description of Service</h2>
        <p className="text-white/80">
          Cinephile is a web-based application that allows users to discover movies, browse movie details, and maintain personal watchlists. We utilize the TMDB API to provide movie data and imagery. We are not endorsed or certified by TMDB.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. User Accounts</h2>
        <p className="text-white/80">
          If you create an account on the Service, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account and any other actions taken in connection with it.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Intellectual Property</h2>
        <p className="text-white/80">
          The Service and its original content, features, and functionality are owned by Cinephile and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws. Movie data and images are property of their respective owners and are provided via the TMDB API.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Termination</h2>
        <p className="text-white/80">
          We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Changes terms</h2>
        <p className="text-white/80">
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Contact Us</h2>
        <p className="text-white/80">
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="text-white/60 italic mt-2">[Contact Information Placeholder]</p>
      </div>
    </motion.div>
  );
}
