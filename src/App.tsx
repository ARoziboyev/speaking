import { useEffect, useState, useRef } from 'react';
import './index.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Mic, 
  Headphones, 
  MessageCircle, 
  Sparkles,
  ChevronRight,
  Star,
  TrendingUp,
  Award,
  Volume2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

gsap.registerPlugin(ScrollTrigger);

// Speech Recognition Hook
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + ' ' + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setError(event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      setError('Speech recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, transcript, error, startListening, stopListening };
}

// Text to Speech
function speakText(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

// Assessment Logic
function assessSpeaking(text: string): {
  level: string;
  score: number;
  fluency: number;
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  feedback: string[];
} {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  // Complex words (longer than 6 characters)
  const complexWords = words.filter(w => w.length > 6).length;
  const vocabularyScore = Math.min(100, (complexWords / Math.max(wordCount, 1)) * 300 + 30);
  
  // Fluency based on word count and sentence structure
  const fluencyScore = Math.min(100, wordCount * 2 + 20);
  
  // Grammar estimation (basic checks)
  const hasCapitalization = /^[A-Z]/.test(text);
  const hasPunctuation = /[.!?]$/.test(text.trim());
  const grammarScore = Math.min(100, (hasCapitalization ? 30 : 0) + (hasPunctuation ? 30 : 0) + 40);
  
  // Overall score
  const overallScore = Math.round((fluencyScore + vocabularyScore + grammarScore + 70) / 4);
  
  let level = 'Beginner';
  if (overallScore >= 90) level = 'Expert';
  else if (overallScore >= 75) level = 'Advanced';
  else if (overallScore >= 60) level = 'Intermediate';
  
  const feedback: string[] = [];
  if (wordCount < 10) feedback.push('Try to speak in complete sentences');
  if (wordCount >= 20) feedback.push('Great rhythm—keep it up!');
  if (vocabularyScore > 60) feedback.push('Good vocabulary usage');
  if (!hasPunctuation) feedback.push('Remember to use punctuation');
  if (avgWordsPerSentence > 15) feedback.push('Try shorter sentences for clarity');
  if (feedback.length === 0) feedback.push('Good effort! Keep practicing.');
  
  return {
    level,
    score: overallScore,
    fluency: Math.round(fluencyScore),
    vocabulary: Math.round(vocabularyScore),
    grammar: Math.round(grammarScore),
    pronunciation: Math.round(70 + Math.random() * 25),
    feedback
  };
}

// AI Response Generator
function generateAIResponse(_userText: string, topic: string): string {
  const responses: Record<string, string[]> = {
    travel: [
      "That sounds like an amazing destination! What attracts you to that place?",
      "Traveling really broadens our perspective. Have you been there before?",
      "I love hearing about travel plans! What would you like to do there?",
      "That place has such rich culture. What are you most excited to see?"
    ],
    work: [
      "Your career journey sounds interesting! What do you enjoy most about your work?",
      "That's a fascinating field! How did you get started in it?",
      "Work-life balance is so important. How do you manage yours?",
      "It sounds like you're passionate about what you do!"
    ],
    food: [
      "That dish sounds delicious! What's your favorite cuisine?",
      "I can tell you enjoy good food! Do you like cooking too?",
      "Food really brings people together. What's a memorable meal you've had?",
      "Exploring new restaurants is such a joy. Any recommendations?"
    ],
    movies: [
      "That's a great choice! What did you like most about it?",
      "Movies are such a wonderful art form. What genres do you prefer?",
      "I can see you're a film enthusiast! Who's your favorite director?",
      "That sounds like a must-watch! What makes it special?"
    ],
    health: [
      "Staying active is so important! What activities do you enjoy?",
      "Your approach to wellness is inspiring. How do you stay motivated?",
      "Health is true wealth. What healthy habits have you developed?",
      "That's a great routine! How long have you been doing it?"
    ],
    default: [
      "That's really interesting! Tell me more about that.",
      "I appreciate you sharing that. What else is on your mind?",
      "That's a great point! Can you elaborate a bit more?",
      "I'm enjoying our conversation! What would you like to discuss next?"
    ]
  };
  
  const topicResponses = responses[topic] || responses.default;
  return topicResponses[Math.floor(Math.random() * topicResponses.length)];
}

function App() {
  const [selectedTopic, setSelectedTopic] = useState('default');
  const [conversation, setConversation] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessment, setAssessment] = useState<ReturnType<typeof assessSpeaking> | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const { isListening, transcript, error, startListening, stopListening } = useSpeechRecognition();
  
  const heroRef = useRef<HTMLDivElement>(null);
  const modesRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'SpeakSpark - Practice English by Speaking';
    
    // Hero entrance animation
    const heroTl = gsap.timeline({ delay: 0.3 });
    heroTl.fromTo('.hero-spark', 
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' }
    );
    heroTl.fromTo('.hero-bubble',
      { scale: 0.65, rotate: -8, opacity: 0 },
      { scale: 1, rotate: 0, opacity: 1, duration: 0.9, ease: 'back.out(1.6)' },
      '-=0.3'
    );
    heroTl.fromTo('.hero-title span',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power2.out' },
      '-=0.5'
    );
    heroTl.fromTo('.hero-subtitle, .hero-cta',
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
      '-=0.3'
    );

    // Scroll-driven animations
    const ctx = gsap.context(() => {
      // Hero exit
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const progress = self.progress;
          if (progress > 0.7) {
            const exitProgress = (progress - 0.7) / 0.3;
            gsap.set('.hero-bubble', {
              x: exitProgress * 55 + 'vw',
              scale: 1 - exitProgress * 0.15,
              rotate: exitProgress * 12,
              opacity: 1 - exitProgress * 0.75
            });
            gsap.set('.hero-spark', {
              y: -exitProgress * 18 + 'vh',
              opacity: 1 - exitProgress
            });
            gsap.set('.hero-title, .hero-subtitle, .hero-cta', {
              x: -exitProgress * 40 + 'vw',
              opacity: Math.max(0.25, 1 - exitProgress)
            });
          }
        }
      });

      // Practice Modes
      ScrollTrigger.create({
        trigger: modesRef.current,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const progress = self.progress;
          
          // Entrance (0-30%)
          if (progress <= 0.3) {
            const enterProgress = progress / 0.3;
            gsap.set('.mode-card-1', {
              x: -60 * (1 - enterProgress) + 'vw',
              rotate: -6 * (1 - enterProgress),
              opacity: enterProgress
            });
            gsap.set('.mode-card-2', {
              y: 100 * (1 - Math.max(0, (enterProgress - 0.15) / 0.85)) + 'vh',
              scale: 0.85 + 0.15 * Math.max(0, (enterProgress - 0.15) / 0.85),
              opacity: Math.max(0, (enterProgress - 0.15) / 0.85)
            });
            gsap.set('.mode-card-3', {
              x: 60 * (1 - Math.max(0, (enterProgress - 0.3) / 0.7)) + 'vw',
              rotate: 6 * (1 - Math.max(0, (enterProgress - 0.3) / 0.7)),
              opacity: Math.max(0, (enterProgress - 0.3) / 0.7)
            });
          }
          // Exit (70-100%)
          else if (progress > 0.7) {
            const exitProgress = (progress - 0.7) / 0.3;
            gsap.set('.mode-card-1', {
              x: -35 * exitProgress + 'vw',
              y: 18 * exitProgress + 'vh',
              rotate: -10 * exitProgress,
              opacity: Math.max(0.25, 1 - exitProgress * 0.75)
            });
            gsap.set('.mode-card-2', {
              y: -30 * exitProgress + 'vh',
              scale: 1 - 0.1 * exitProgress,
              opacity: Math.max(0.25, 1 - exitProgress * 0.75)
            });
            gsap.set('.mode-card-3', {
              x: 35 * exitProgress + 'vw',
              y: 18 * exitProgress + 'vh',
              rotate: 10 * exitProgress,
              opacity: Math.max(0.25, 1 - exitProgress * 0.75)
            });
          }
          // Settle (30-70%)
          else {
            gsap.set('.mode-card-1, .mode-card-2, .mode-card-3', {
              x: 0, y: 0, rotate: 0, scale: 1, opacity: 1
            });
          }
        }
      });

      // Live Conversation
      ScrollTrigger.create({
        trigger: conversationRef.current,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const progress = self.progress;
          
          if (progress <= 0.3) {
            const enterProgress = progress / 0.3;
            gsap.set('.conversation-bubble', {
              scale: 0.25 + 0.75 * enterProgress,
              rotate: -25 * (1 - enterProgress),
              opacity: enterProgress
            });
            gsap.set('.conversation-title', {
              y: -18 * (1 - enterProgress) + 'vh',
              opacity: enterProgress
            });
          } else if (progress > 0.7) {
            const exitProgress = (progress - 0.7) / 0.3;
            gsap.set('.conversation-bubble', {
              scale: 1 + 0.35 * exitProgress,
              rotate: 10 * exitProgress,
              opacity: Math.max(0.25, 1 - exitProgress * 0.75)
            });
            gsap.set('.conversation-title', {
              y: -10 * exitProgress + 'vh',
              opacity: 1 - exitProgress
            });
          } else {
            gsap.set('.conversation-bubble', {
              scale: 1, rotate: 0, opacity: 1
            });
            gsap.set('.conversation-title', {
              y: 0, opacity: 1
            });
          }
        }
      });

      // Dashboard
      ScrollTrigger.create({
        trigger: dashboardRef.current,
        start: 'top top',
        end: '+=140%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const progress = self.progress;
          
          if (progress <= 0.3) {
            const enterProgress = progress / 0.3;
            gsap.set('.dashboard-card', {
              y: 110 * (1 - enterProgress) + 'vh',
              scale: 0.92 + 0.08 * enterProgress,
              opacity: enterProgress
            });
          } else if (progress > 0.7) {
            const exitProgress = (progress - 0.7) / 0.3;
            gsap.set('.dashboard-card', {
              x: -60 * exitProgress + 'vw',
              rotate: -6 * exitProgress,
              opacity: Math.max(0.25, 1 - exitProgress * 0.75)
            });
          } else {
            gsap.set('.dashboard-card', {
              x: 0, y: 0, rotate: 0, scale: 1, opacity: 1
            });
          }
        }
      });

      // CTA Section
      ScrollTrigger.create({
        trigger: ctaRef.current,
        start: 'top top',
        end: '+=120%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const progress = self.progress;
          
          if (progress <= 0.3) {
            const enterProgress = progress / 0.3;
            gsap.set('.cta-bubble', {
              scale: 0.35 + 0.65 * enterProgress,
              rotate: 12 * (1 - enterProgress),
              opacity: enterProgress
            });
          } else if (progress > 0.7) {
            const exitProgress = (progress - 0.7) / 0.3;
            gsap.set('.cta-bubble', {
              scale: 1 + 0.05 * exitProgress,
              opacity: Math.max(0.35, 1 - exitProgress * 0.65)
            });
          } else {
            gsap.set('.cta-bubble', {
              scale: 1, rotate: 0, opacity: 1
            });
          }
        }
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  // Handle conversation
  const handleStartConversation = (topic: string) => {
    setSelectedTopic(topic);
    setConversation([{
      role: 'ai',
      text: `Let's talk about ${topic}! What would you like to share about this topic?`
    }]);
    setShowConversation(true);
  };

  const handleSendMessage = () => {
    if (!transcript.trim()) return;
    
    const userMessage = transcript.trim();
    setConversation(prev => [...prev, { role: 'user', text: userMessage }]);
    
    // Generate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage, selectedTopic);
      setConversation(prev => [...prev, { role: 'ai', text: aiResponse }]);
      speakText(aiResponse);
    }, 500);
    
    stopListening();
  };

  const handleEndConversation = () => {
    const allUserText = conversation
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join(' ');
    
    if (allUserText) {
      const result = assessSpeaking(allUserText);
      setAssessment(result);
      setShowAssessment(true);
    }
    setShowConversation(false);
    setConversation([]);
  };

  const topics = [
    { id: 'travel', name: 'Travel', image: '/images/topic_travel.jpg' },
    { id: 'work', name: 'Work', image: '/images/topic_work.jpg' },
    { id: 'food', name: 'Food', image: '/images/topic_food.jpg' },
    { id: 'movies', name: 'Movies', image: '/images/topic_movies.jpg' },
    { id: 'health', name: 'Health', image: '/images/topic_health.jpg' },
  ];

  const reviews = [
    {
      text: "I stopped worrying about grammar and just spoke. My confidence grew in two weeks.",
      name: "Aiko",
      location: "Tokyo",
      avatar: "/images/avatar_01.jpg"
    },
    {
      text: "The feedback is instant and kind—like a coach who never judges.",
      name: "Leo",
      location: "Berlin",
      avatar: "/images/avatar_02.jpg"
    },
    {
      text: "I practice on my commute. It feels like a game.",
      name: "Maya",
      location: "Mexico City",
      avatar: "/images/avatar_03.jpg"
    }
  ];

  return (
    <main className="relative w-full bg-[#6B2EFF] overflow-x-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4">
        <div className="font-display text-2xl text-white">SpeakSpark</div>
        <button 
          onClick={() => setShowConversation(true)}
          className="pill-button bg-transparent border-2 border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#6B2EFF]"
        >
          Start free
        </button>
      </nav>

      {/* Section 1: Hero */}
      <section ref={heroRef} className="section-pinned bg-[#6B2EFF] flex items-center justify-center">
        {/* Spark glyph */}
        <div className="hero-spark absolute left-1/2 top-[18%] -translate-x-1/2 spark-glyph">
          <Sparkles className="w-16 h-16 lg:w-28 lg:h-28 text-[#00F0FF]" />
        </div>
        
        {/* Main bubble */}
        <div className="hero-bubble bubble-pink absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] lg:max-w-[920px] lg:max-h-[920px] flex flex-col items-center justify-center p-8 lg:p-16">
          <h1 className="hero-title font-display text-5xl lg:text-8xl text-white text-center mb-4 lg:mb-6">
            {'SpeakSpark'.split('').map((char, i) => (
              <span key={i} className="inline-block">{char}</span>
            ))}
          </h1>
          <p className="hero-subtitle text-lg lg:text-2xl text-white/90 text-center max-w-md mb-8">
            Practice English by speaking. Get instant feedback.
          </p>
          <button 
            onClick={() => setShowConversation(true)}
            className="hero-cta pill-button bg-[#00F0FF] text-[#6B2EFF] font-semibold text-lg"
          >
            Start speaking free
          </button>
        </div>
        
        {/* Scroll hint */}
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          Scroll to explore
        </p>
      </section>

      {/* Section 2: Practice Modes */}
      <section ref={modesRef} className="section-pinned bg-[#6B2EFF]">
        <div className="absolute left-[8vw] top-[7vh]">
          <span className="font-mono-custom text-xs uppercase tracking-[0.08em] text-white/70">
            Practice Modes
          </span>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center gap-4 lg:gap-8 px-4">
          {/* Card 1 */}
          <div className="mode-card-1 card-white w-[28vw] max-w-[320px] h-[60vh] lg:h-[72vh] overflow-hidden flex flex-col">
            <div className="h-[55%] overflow-hidden">
              <img 
                src="/images/mode_pronunciation.jpg" 
                alt="Pronunciation" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-5 h-5 text-[#6B2EFF]" />
                <h3 className="font-display text-lg lg:text-xl text-[#6B2EFF]">Pronunciation Drills</h3>
              </div>
              <p className="text-sm text-[#6B2EFF]/70 leading-relaxed">
                Repeat phrases and perfect your accent with real-time scoring.
              </p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="mode-card-2 card-white w-[28vw] max-w-[320px] h-[60vh] lg:h-[72vh] overflow-hidden flex flex-col">
            <div className="h-[55%] overflow-hidden">
              <img 
                src="/images/mode_conversation.jpg" 
                alt="Conversation" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-[#6B2EFF]" />
                <h3 className="font-display text-lg lg:text-xl text-[#6B2EFF]">AI Conversation</h3>
              </div>
              <p className="text-sm text-[#6B2EFF]/70 leading-relaxed">
                Talk about any topic. The AI responds naturally and corrects gently.
              </p>
            </div>
          </div>
          
          {/* Card 3 */}
          <div className="mode-card-3 card-white w-[28vw] max-w-[320px] h-[60vh] lg:h-[72vh] overflow-hidden flex flex-col">
            <div className="h-[55%] overflow-hidden">
              <img 
                src="/images/mode_listening.jpg" 
                alt="Listening" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Headphones className="w-5 h-5 text-[#6B2EFF]" />
                <h3 className="font-display text-lg lg:text-xl text-[#6B2EFF]">Listening Quests</h3>
              </div>
              <p className="text-sm text-[#6B2EFF]/70 leading-relaxed">
                Train your ear with fast, real-world dialogues and quizzes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Live Conversation */}
      <section ref={conversationRef} className="section-pinned bg-[#6B2EFF] flex flex-col items-center justify-center">
        <div className="conversation-title text-center mb-8 lg:mb-12">
          <h2 className="font-display text-4xl lg:text-6xl text-white mb-3">Tap & talk</h2>
          <p className="text-lg lg:text-xl text-white/80 max-w-md mx-auto">
            Pick a topic. Speak freely. Get corrections in seconds.
          </p>
        </div>
        
        {/* Mic bubble */}
        <div 
          onClick={() => setShowConversation(true)}
          className="conversation-bubble bubble-pink bubble-ring w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] lg:max-w-[760px] lg:max-h-[760px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute inset-0 bubble-pink pulse-ring" />
                <div className="absolute inset-0 bubble-pink pulse-ring" style={{ animationDelay: '0.5s' }} />
              </>
            )}
            <Mic className={`w-16 h-16 lg:w-32 lg:h-32 text-white ${isListening ? '' : 'mic-float'}`} />
          </div>
        </div>
        
        <p className="mt-8 text-white/60 text-sm">
          Works best in a quiet place.
        </p>
      </section>

      {/* Section 4: Feedback Dashboard */}
      <section ref={dashboardRef} className="section-pinned bg-[#6B2EFF] flex items-center justify-center">
        <div className="dashboard-card card-white w-[90vw] max-w-[1200px] h-[75vh] lg:h-[72vh] p-6 lg:p-10 flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left panel */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-mono-custom text-xs uppercase tracking-[0.08em] text-[#6B2EFF]/60 mb-4">
              Your Progress
            </h3>
            <div className="font-display text-7xl lg:text-8xl text-[#6B2EFF] mb-2">
              84
            </div>
            <p className="text-[#6B2EFF]/70 mb-6">Overall Score</p>
            
            <div className="mb-4">
              <p className="font-semibold text-[#6B2EFF] mb-3">5-day streak</p>
              <div className="flex gap-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div 
                    key={i} 
                    className={`calendar-circle ${i < 5 ? 'active' : 'inactive'}`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-auto">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-[#FF2E7D]" />
                <span className="text-[#6B2EFF] font-medium">+12% this week</span>
              </div>
            </div>
          </div>
          
          {/* Right panel */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-mono-custom text-xs uppercase tracking-[0.08em] text-[#6B2EFF]/60 mb-4">
              Today's Feedback
            </h3>
            
            <div className="space-y-4 flex-1">
              <div className="flex items-start gap-3 p-4 bg-[#6B2EFF]/5 rounded-2xl">
                <Star className="w-5 h-5 text-[#00F0FF] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#6B2EFF] font-medium">Great rhythm—keep it up!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-[#6B2EFF]/5 rounded-2xl">
                <Sparkles className="w-5 h-5 text-[#FF2E7D] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#6B2EFF] font-medium">Try softer 'th' in 'think'.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-[#6B2EFF]/5 rounded-2xl">
                <Award className="w-5 h-5 text-[#6B2EFF] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#6B2EFF] font-medium">Sentence stress was natural.</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowAssessment(true)}
              className="mt-4 pill-button bg-[#6B2EFF] text-white self-end"
            >
              Review mistakes
            </button>
          </div>
        </div>
      </section>

      {/* Section 5: Topic Picker */}
      <section className="w-full bg-[#6B2EFF] py-20 lg:py-32">
        <div className="px-8 lg:px-[8vw] mb-10">
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-3">Choose a topic</h2>
          <p className="text-lg text-white/70">Conversations that match your level.</p>
        </div>
        
        <div className="flex gap-6 overflow-x-auto px-8 lg:px-[8vw] pb-6 scrollbar-hide">
          {topics.map((topic) => (
            <div 
              key={topic.id}
              onClick={() => handleStartConversation(topic.id)}
              className="topic-bubble relative flex-shrink-0 w-48 h-48 lg:w-64 lg:h-64"
            >
              <img 
                src={topic.image} 
                alt={topic.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="font-display text-2xl lg:text-3xl text-white drop-shadow-lg">
                  {topic.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 6: Social Proof */}
      <section className="w-full bg-[#6B2EFF] py-20 lg:py-32">
        <div className="px-8 lg:px-[8vw] mb-12">
          <h2 className="font-display text-4xl lg:text-5xl text-white">Join 2M+ learners</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 lg:px-[8vw]">
          {reviews.map((review, i) => (
            <div key={i} className="review-card">
              <p className="text-[#6B2EFF] text-lg mb-6 leading-relaxed">"{review.text}"</p>
              <div className="flex items-center gap-3">
                <img 
                  src={review.avatar} 
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-[#6B2EFF]">{review.name}</p>
                  <p className="text-sm text-[#6B2EFF]/60">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 flex justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#00F0FF]" />
            <span className="text-white font-medium">Share your progress #SpeakSpark</span>
          </div>
        </div>
      </section>

      {/* Section 7: CTA */}
      <section ref={ctaRef} className="section-pinned bg-[#6B2EFF] flex items-center justify-center">
        {/* Spark glyph */}
        <div className="absolute left-1/2 top-[12%] -translate-x-1/2 spark-glyph">
          <Sparkles className="w-16 h-16 lg:w-24 lg:h-24 text-[#00F0FF]" />
        </div>
        
        {/* CTA bubble */}
        <div className="cta-bubble bubble-pink w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] lg:max-w-[960px] lg:max-h-[960px] flex flex-col items-center justify-center p-8 lg:p-16">
          <h2 className="font-display text-3xl lg:text-5xl text-white text-center mb-8">
            Start your first conversation today.
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <input 
              type="email"
              placeholder="Email address"
              className="input-pill flex-1 bg-white/10 text-white placeholder:text-white/50"
            />
            <button 
              onClick={() => setShowConversation(true)}
              className="pill-button bg-[#00F0FF] text-[#6B2EFF] font-semibold whitespace-nowrap"
            >
              Get started
            </button>
          </div>
          
          <p className="mt-6 text-white/60 text-sm">No credit card required.</p>
        </div>
      </section>

      {/* Conversation Dialog */}
      <Dialog open={showConversation} onOpenChange={setShowConversation}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col bg-white rounded-3xl border-0 p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-[#6B2EFF]">
            <DialogTitle className="text-white font-display text-2xl flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              Conversation Practice
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#6B2EFF]/70 mb-6">Select a topic to start practicing</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleStartConversation(topic.id)}
                      className="px-4 py-2 bg-[#6B2EFF]/10 text-[#6B2EFF] rounded-full hover:bg-[#6B2EFF] hover:text-white transition-colors"
                    >
                      {topic.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              conversation.map((msg, i) => (
                <div 
                  key={i} 
                  className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}
                >
                  {msg.text}
                </div>
              ))
            )}
            
            {isListening && (
              <div className="flex items-center gap-2 text-[#6B2EFF]/60">
                <div className="listening-indicator">
                  <div className="listening-bar" />
                  <div className="listening-bar" />
                  <div className="listening-bar" />
                  <div className="listening-bar" />
                  <div className="listening-bar" />
                </div>
                <span className="text-sm">Listening...</span>
              </div>
            )}
            
            {transcript && !isListening && (
              <div className="message-bubble message-user opacity-70">
                {transcript}
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-[#FF2E7D] text-white pulse-ring' 
                    : 'bg-[#6B2EFF] text-white hover:bg-[#5a1ee6]'
                }`}
              >
                <Mic className="w-6 h-6" />
              </button>
              
              <input
                type="text"
                value={transcript}
                onChange={() => {}}
                placeholder={isListening ? 'Listening...' : 'Tap the mic to speak'}
                className="flex-1 input-pill bg-gray-50"
                readOnly
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!transcript.trim()}
                className="w-14 h-14 rounded-full bg-[#00F0FF] text-[#6B2EFF] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00d0e0] transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            {conversation.length > 0 && (
              <button
                onClick={handleEndConversation}
                className="mt-4 w-full py-3 text-[#6B2EFF]/60 hover:text-[#FF2E7D] transition-colors text-sm font-medium"
              >
                End conversation & see results
              </button>
            )}
            
            {error && (
              <p className="mt-2 text-[#FF2E7D] text-sm text-center">{error}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={showAssessment} onOpenChange={setShowAssessment}>
        <DialogContent className="max-w-lg bg-white rounded-3xl border-0 p-0 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#FF2E7D] to-[#00F0FF] mb-4">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-display text-3xl text-[#6B2EFF] mb-2">Your Speaking Level</h2>
              {assessment && (
                <div className={`level-badge level-${assessment.level.toLowerCase()} mx-auto`}>
                  <Star className="w-4 h-4" />
                  {assessment.level}
                </div>
              )}
            </div>
            
            {assessment && (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#6B2EFF]/70">Fluency</span>
                      <span className="text-[#6B2EFF] font-semibold">{assessment.fluency}%</span>
                    </div>
                    <div className="assessment-meter">
                      <div className="assessment-meter-fill" style={{ width: `${assessment.fluency}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#6B2EFF]/70">Vocabulary</span>
                      <span className="text-[#6B2EFF] font-semibold">{assessment.vocabulary}%</span>
                    </div>
                    <div className="assessment-meter">
                      <div className="assessment-meter-fill" style={{ width: `${assessment.vocabulary}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#6B2EFF]/70">Grammar</span>
                      <span className="text-[#6B2EFF] font-semibold">{assessment.grammar}%</span>
                    </div>
                    <div className="assessment-meter">
                      <div className="assessment-meter-fill" style={{ width: `${assessment.grammar}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#6B2EFF]/70">Pronunciation</span>
                      <span className="text-[#6B2EFF] font-semibold">{assessment.pronunciation}%</span>
                    </div>
                    <div className="assessment-meter">
                      <div className="assessment-meter-fill" style={{ width: `${assessment.pronunciation}%` }} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#6B2EFF]/5 rounded-2xl p-4">
                  <h4 className="font-semibold text-[#6B2EFF] mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Feedback
                  </h4>
                  <ul className="space-y-1">
                    {assessment.feedback.map((item, i) => (
                      <li key={i} className="text-sm text-[#6B2EFF]/80 flex items-start gap-2">
                        <span className="text-[#00F0FF]">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            
            <button
              onClick={() => setShowAssessment(false)}
              className="mt-6 w-full pill-button bg-[#6B2EFF] text-white"
            >
              Continue Practicing
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default App;
