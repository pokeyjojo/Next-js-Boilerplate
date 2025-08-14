'use client';

import { useState } from 'react';
import Map from './Map';
import MeetInTheMiddle from './MeetInTheMiddle';
import { type TennisCourt } from '@/hooks/useCourtData';

function AboutContent() {
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);

  return (
    <div className="min-h-full w-full bg-[#F4F5F6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-[#F4F5F6] rounded-lg shadow-2xl p-6 md:p-8 border border-[#BFC37C]">
          <h1 className="text-4xl md:text-5xl font-bold text-[#7F8B9F] mb-6">
            About
          </h1>
          <div className="text-lg text-[#7F8B9F] leading-relaxed space-y-4">
            <p>
              Welcome to <span className="text-[#7F8B9F] font-semibold">www.chicago.tennis</span>, 
              your ultimate destination for tennis in the Chicagoland area.
            </p>
            <p>
              Notice a Court is missing? Feel Free to add it using our <span className="text-[#7F8B9F] font-semibold">Suggest A Court</span> feature. 
              If you notice an error in one of the courts, feel free to suggest an edit, and it will be looked at by the community.
            </p>
            <p>
              Need to find a court that's convenient for you and a friend? Use our new <span className="text-[#7F8B9F] font-semibold">Meet in the Middle</span> feature 
              to find courts between two addresses with driving times from each location.
            </p>
            <p>
              The most important thing that you can do is add photos or a review to the courts you visit, 
              so that other people know what to expect.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setShowDeveloperModal(true)}
                className="inline-block bg-[#F4F5F6] px-6 py-3 rounded-full border-2 border-[#BFC37C] transition-all duration-200 shadow-lg hover:shadow-xl text-[#7F8B9F]"
              >
                <span className="text-[#7F8B9F] font-medium transition-colors duration-200">
                  About the Developer
                </span>
              </button>
              <button
                onClick={() => setShowSponsorModal(true)}
                className="inline-block bg-[#F4F5F6] px-6 py-3 rounded-full border-2 border-[#BFC37C] transition-all duration-200 shadow-lg hover:shadow-xl text-[#7F8B9F]"
              >
                <span className="text-[#7F8B9F] font-medium transition-colors duration-200">
                  About the sponsor
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Modal */}
      {showDeveloperModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#F4F5F6] rounded-lg shadow-2xl border-2 border-[#BFC37C] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#7F8B9F]">
                  About the Developer
                </h2>
                <button
                  onClick={() => setShowDeveloperModal(false)}
                  className="text-[#7F8B9F] p-2 rounded-full transition-all duration-200"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-full max-w-md rounded-lg overflow-hidden shadow-lg border-2 border-[#BFC37C]">
                    <img 
                      src="/assets/images/johnny-schwan.jpg" 
                      alt="Johnny Schwan - Developer of Court Finder" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-[#7F8B9F] leading-relaxed space-y-4">
                    <p>
                      Hello! I'm <span className="text-[#69F0FD] font-semibold">Johnny Schwan</span>, a high school student and I love playing tennis. 
                      However, I was unable to find good courts to play on that were near me.
                    </p>
                    <p>
                      I built this Court Finder to help others be able to find the best courts to play near them, 
                      and to be able to share information with others.
                    </p>
                    <p>
                      If you encounter any issues or have any feedback to make the Court Finder even better, 
                      let me know by emailing me at{' '}
                      <a 
                        href="mailto:johnny@theschwans.io" 
                        className="text-[#7F8B9F] underline transition-colors duration-200"
                      >
                        johnny@theschwans.io
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sponsor Modal */}
      {showSponsorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#F4F5F6] rounded-lg shadow-2xl border-2 border-[#BFC37C] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#7F8B9F]">
                  About the sponsor
                </h2>
                <button
                  onClick={() => setShowSponsorModal(false)}
                  className="text-[#7F8B9F] p-2 rounded-full transition-all duration-200"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-[#7F8B9F] leading-relaxed space-y-4">
                    <p>
                      <span className="text-[#7F8B9F] font-semibold">Chicago.tennis</span> is thrilled to announce its proud sponsorship by{' '}
                      <span className="text-[#7F8B9F] font-semibold">Gladiator</span>, Chicago's premier and top-ranked flexible tennis league.
                    </p>
                    <p>
                      Gladiator offers an unparalleled opportunity for tennis enthusiasts of all skill levels to engage in competitive and friendly play. 
                      Whether you're a seasoned pro or just starting, Gladiator has a league perfectly suited to your game, ensuring an exciting 
                      and rewarding experience on the court.
                    </p>
                    <p>
                      Ready to get started? Go to{' '}
                      <a 
                        href="https://Gladiatortennis.com" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7F8B9F] underline transition-colors duration-200 font-semibold"
                      >
                        Gladiatortennis.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourtFinderWrapper() {
  const [activeTab, setActiveTab] = useState<'finder' | 'meetinthemiddle' | 'about'>('finder');
  const [selectedCourt, setSelectedCourt] = useState<TennisCourt | null>(null);

  const handleCourtSelect = (court: TennisCourt) => {
    setSelectedCourt(court);
    // Switch to the finder tab to show the court details
    setActiveTab('finder');
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F4F5F6] overflow-hidden">
      {/* Banner */}
      <div className="flex-shrink-0 w-full h-16 md:h-20 bg-[#F4F5F6] flex items-center justify-between px-4 md:px-6 relative overflow-hidden border-b border-[#BFC37C]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+Cjwvc3ZnPg==')] opacity-20"></div>
        
        {/* Navigation buttons */}
        <div className="relative z-10 flex space-x-2">
          <button
            onClick={() => setActiveTab('finder')}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium text-sm md:text-base transition-all duration-200 ${
              activeTab === 'finder'
                ? 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C] shadow-lg'
                : 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C]'
            }`}
          >
            <div className="flex items-center space-x-1 md:space-x-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden md:inline">Court Finder</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('meetinthemiddle')}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium text-sm md:text-base transition-all duration-200 ${
              activeTab === 'meetinthemiddle'
                ? 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C] shadow-lg'
                : 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C]'
            }`}
          >
            <div className="flex items-center space-x-1 md:space-x-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden md:inline">Meet in Middle</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium text-sm md:text-base transition-all duration-200 ${
              activeTab === 'about'
                ? 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C] shadow-lg'
                : 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C]'
            }`}
          >
            <div className="flex items-center space-x-1 md:space-x-2">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden md:inline">About</span>
            </div>
          </button>
        </div>
        
        {/* Center content */}
        <div className="relative z-10 text-center flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#7F8B9F] mb-1">
            www.chicago.tennis
          </h1>
          <p className="text-[#7F8B9F] text-sm md:text-base font-medium">
            The #1 place for tennis in the chicagoland area
          </p>
        </div>
        
        {/* Right spacer to allow room for profile icon */}
        <div className="w-16 md:w-20"></div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'finder' ? (
          <div className="h-full w-full">
            <Map selectedCourtFromExternal={selectedCourt} />
          </div>
        ) : activeTab === 'meetinthemiddle' ? (
          <div className="h-full w-full overflow-y-auto">
            <MeetInTheMiddle onCourtSelect={handleCourtSelect} />
          </div>
        ) : (
          <div className="h-full w-full overflow-y-auto">
            <AboutContent />
          </div>
        )}
      </div>
    </div>
  );
}