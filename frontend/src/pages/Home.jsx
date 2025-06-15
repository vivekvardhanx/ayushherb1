import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { fetchHerbs } from "../services/api";
import { incrementVisitCount, getVisitCount } from "../services/firebase";
import { jsPDF } from "jspdf";
import FirstPage from "../components/FirstPage";
import AyushCards from "../components/AyushCards";
import Footer from "../components/Footer";
import QuizPopup from "../components/QuizPopup";
import HomeNavbar from "../components/HomeNavbar";
import FilterPanel from "../components/FilterPanel";
import PlantCardsSection from "../components/PlantCardsSection";
import PlantPopup from "../components/PlantPopup";
import ChatbotButton from "../components/BotpressChatbot";

const itemsPerPage = 8;

const Home = () => {
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("All Regions");
  const [filterType, setFilterType] = useState("All Types");
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [bookmarkedPlants, setBookmarkedPlants] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const plantCardsRef = useRef(null);

  // Memoize filtered plants to avoid recalculation on every render
  const filteredPlants = useMemo(() => {
    if (!plants || plants.length === 0) return [];
    
    return plants.filter((plant) => {
      const matchesRegion = filterRegion === "All Regions" || plant.region === filterRegion;
      const matchesType = filterType === "All Types" || plant.type === filterType;
      const matchesSearch = plant.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      
      return matchesRegion && matchesType && matchesSearch;
    });
  }, [plants, filterRegion, filterType, searchTerm]);

  const totalPages = Math.ceil(filteredPlants.length / itemsPerPage);

  // Load bookmarked plants from localStorage only once
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("bookmarkedPlants");
      if (savedBookmarks) {
        setBookmarkedPlants(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error("Error parsing bookmarked plants:", error);
      setBookmarkedPlants([]);
    }
  }, []);

  // Fetch plants data with optimized error handling
  useEffect(() => {
    let isMounted = true;

    const getPlants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const response = await Promise.race([fetchHerbs(), timeoutPromise]);
        
        if (!isMounted) return;
        
        if (response && response.data && Array.isArray(response.data)) {
          setPlants(response.data);
          console.log("Plants loaded:", response.data.length);
        } else {
          throw new Error("Invalid data received from server");
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error("Error fetching plants:", err);
        setError(err.message || "Failed to fetch plants. Please try again later.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getPlants();

    return () => {
      isMounted = false;
    };
  }, []);

  // Optimize visit count tracking
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Run these in parallel to reduce loading time
        await Promise.all([
          getVisitCount().then(count => console.log("Visit count:", count)),
          incrementVisitCount()
        ]);
      } catch (error) {
        console.error("Error with visit tracking:", error);
      }
    };

    trackVisit();
  }, []);

  // Auto scroll to plant cards when search or filter changes
  useEffect(() => {
    if (searchTerm || filterRegion !== "All Regions" || filterType !== "All Types") {
      scrollToPlantCards();
    }
  }, [searchTerm, filterRegion, filterType]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleDownloadNotes = useCallback(() => {
    if (!notes.trim()) {
      alert("Please write some notes before downloading.");
      return;
    }
    
    const doc = new jsPDF();
    const plantName = selectedPlant?.name || "Plant";
    
    doc.setFontSize(16);
    doc.text(`Notes for ${plantName}`, 10, 20);
    
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(notes, 180);
    doc.text(splitText, 10, 40);
    
    doc.save(`${plantName}_notes.pdf`);
  }, [notes, selectedPlant?.name]);

  const handleShare = useCallback(() => {
    if (selectedPlant?.sketchfabModelUrl) {
      const shareText = `Check out this amazing 3D model of ${selectedPlant.name}!`;
      const shareUrl = selectedPlant.sketchfabModelUrl;
      
      if (navigator.share) {
        navigator.share({
          title: selectedPlant.name,
          text: shareText,
          url: shareUrl,
        }).catch(console.error);
      } else {
        navigator.clipboard
          .writeText(`${shareText}\n${shareUrl}`)
          .then(() => alert("Link copied to clipboard!"))
          .catch(() => alert("Failed to copy link. Please try again."));
      }
    } else {
      alert("No 3D model available to share.");
    }
  }, [selectedPlant]);

  const openPopup = useCallback((plant) => {
    const multimedia = [
      plant.multimedia1,
      plant.multimedia2,
      plant.multimedia3,
      plant.multimedia4,
    ].filter(Boolean);
    
    setSelectedPlant({ ...plant, multimedia });
    setIsPopupOpen(true);
    setNotes("");
  }, []);

  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
    setSelectedPlant(null);
    setNotes("");
  }, []);

  const handleRegionChange = useCallback((e) => {
    setFilterRegion(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleTypeChange = useCallback((e) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  }, []);

  const toggleFilter = useCallback(() => setIsFilterOpen(prev => !prev), []);
  const toggleQuiz = useCallback(() => setIsQuizOpen(prev => !prev), []);
  const toggleChatbot = useCallback(() => setShowChatbot(prev => !prev), []);
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleBookmark = useCallback((plant) => {
    setBookmarkedPlants((prev) => {
      const isBookmarked = prev.some((p) => p._id === plant._id);
      const updatedBookmarks = isBookmarked
        ? prev.filter((p) => p._id !== plant._id)
        : [...prev, plant];
      
      try {
        localStorage.setItem("bookmarkedPlants", JSON.stringify(updatedBookmarks));
      } catch (error) {
        console.error("Error saving bookmarks:", error);
      }
      
      return updatedBookmarks;
    });
  }, []);

  const scrollToPlantCards = useCallback(() => {
    if (plantCardsRef.current) {
      plantCardsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Early returns for loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 border-solid mx-auto mb-4"></div>
          <p className="text-green-600 text-lg">Loading herbs...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <p className="text-gray-600 mb-4">
            There seems to be an issue loading the herbs. This could be due to:
          </p>
          <ul className="text-left text-gray-500 text-sm mb-6">
            <li>• Slow internet connection</li>
            <li>• Server maintenance</li>
            <li>• API timeout</li>
          </ul>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-poppins scrollbar-thin">
      <HomeNavbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onToggleFilter={toggleFilter}
        onToggleQuiz={toggleQuiz}
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
      />

      <FirstPage onGetStartedClick={scrollToPlantCards} />

      <FilterPanel
        isFilterOpen={isFilterOpen}
        filterRegion={filterRegion}
        filterType={filterType}
        handleRegionChange={handleRegionChange}
        handleTypeChange={handleTypeChange}
      />

      {isQuizOpen && <QuizPopup isOpen={isQuizOpen} onClose={toggleQuiz} />}

      <ChatbotButton showChatbot={showChatbot} toggleChatbot={toggleChatbot} />

      <div ref={plantCardsRef} className="min-h-screen px-4 sm:px-6 py-6">
        {filteredPlants.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No herbs found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <PlantCardsSection
            plants={filteredPlants}
            onLearnMore={openPopup}
            onBookmark={handleBookmark}
            bookmarkedPlants={bookmarkedPlants}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* Optimized Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2 pb-8">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            First
          </button>

          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            Prev
          </button>

          {[...Array(Math.min(totalPages, 5))].map((_, index) => {
            let page;
            if (totalPages <= 5) {
              page = index + 1;
            } else if (currentPage <= 3) {
              page = index + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + index;
            } else {
              page = currentPage - 2 + index;
            }

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded transition-colors ${
                  page === currentPage 
                    ? "bg-green-500 text-white" 
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            Next
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
          >
            Last
          </button>
        </div>
      )}

      <PlantPopup
        isOpen={isPopupOpen}
        plant={selectedPlant}
        onClose={closePopup}
        notes={notes}
        setNotes={setNotes}
        handleDownloadNotes={handleDownloadNotes}
        handleShare={handleShare}
      />

      <AyushCards />
      <Footer />
    </div>
  );
};

export default Home;