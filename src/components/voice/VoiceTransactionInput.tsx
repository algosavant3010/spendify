import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceTransactionInputProps {
  onTranscriptParsed: (data: {
    title?: string;
    amount?: string;
    type?: "income" | "expense";
    description?: string;
    suggestedCategory?: string;
  }) => void;
}

const VoiceTransactionInput = ({ onTranscriptParsed }: VoiceTransactionInputProps) => {
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useVoiceInput();
  const [isParsing, setIsParsing] = useState(false);
  const onTranscriptParsedRef = useRef(onTranscriptParsed);
  const resetTranscriptRef = useRef(resetTranscript);

  useEffect(() => {
    onTranscriptParsedRef.current = onTranscriptParsed;
    resetTranscriptRef.current = resetTranscript;
  }, [onTranscriptParsed, resetTranscript]);

  useEffect(() => {
    // Parse transcript when user stops speaking
    const parseTranscript = async () => {
      if (!transcript || isListening) return;

      setIsParsing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Please sign in to use voice input");
          return;
        }

        // Use AI to parse the voice input
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-voice-transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ transcript }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error("Rate limit exceeded. Please try again later.");
          } else {
            throw new Error('Failed to parse voice input');
          }
          return;
        }

        const data = await response.json();
        if (data.success && data.data) {
          onTranscriptParsedRef.current(data.data);
          toast.success("Voice input processed!");
          resetTranscriptRef.current();
        }
      } catch (error) {
        console.error("Error parsing voice:", error);
        // Fallback: try basic parsing
        const basicParse = parseBasicTranscript(transcript);
        if (basicParse) {
          onTranscriptParsedRef.current(basicParse);
          toast.success("Voice input processed!");
        } else {
          toast.error("Couldn't parse voice input. Try again.");
        }
      } finally {
        setIsParsing(false);
      }
    };

    // Delay parsing to allow for final results
    const timeout = setTimeout(parseTranscript, 1500);
    return () => clearTimeout(timeout);
  }, [transcript, isListening]);

  // Enhanced basic parsing fallback
  const parseBasicTranscript = (text: string): {
    title: string;
    amount: string | undefined;
    type: "income" | "expense";
    description: string;
    suggestedCategory?: string;
  } => {
    const lowerText = text.toLowerCase();
    
    // Enhanced amount detection - handles more formats
    let amount: string | undefined;
    
    // Match various number formats
    const numberPatterns = [
      /(?:rs\.?|₹|rupees?|inr)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i,
      /(\d+(?:\.\d{1,2})?)\s*(?:rs\.?|₹|rupees?|inr)?/i,
      /(\d+)k/i, // 1k = 1000
    ];
    
    for (const pattern of numberPatterns) {
      const match = text.match(pattern);
      if (match) {
        let num = match[1].replace(/,/g, '');
        if (pattern.source.includes('k')) {
          num = String(parseFloat(num) * 1000);
        }
        amount = num;
        break;
      }
    }

    // Word to number conversion for common amounts
    const wordNumbers: Record<string, number> = {
      'hundred': 100, 'thousand': 1000, 'lakh': 100000, 'crore': 10000000,
      'fifty': 50, 'twenty': 20, 'ten': 10, 'five': 5,
    };
    
    if (!amount) {
      for (const [word, value] of Object.entries(wordNumbers)) {
        if (lowerText.includes(word)) {
          const multiplierMatch = lowerText.match(new RegExp(`(\\d+)\\s*${word}`));
          amount = multiplierMatch 
            ? String(parseFloat(multiplierMatch[1]) * value)
            : String(value);
          break;
        }
      }
    }

    // Enhanced type detection
    const expenseWords = /(?:spent|paid|bought|purchased|expense|cost|charged|deducted|given|payment for)/i;
    const incomeWords = /(?:received|got|earned|salary|income|credited|refund|cashback|bonus|payment received)/i;
    
    const type: "income" | "expense" = incomeWords.test(lowerText) && !expenseWords.test(lowerText) 
      ? "income" 
      : "expense";

    // Category detection
    const categoryMap: Record<string, string[]> = {
      'Food & Dining': ['food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'coffee', 'tea', 'snack', 'meal', 'eat'],
      'Transportation': ['uber', 'ola', 'cab', 'taxi', 'petrol', 'fuel', 'gas', 'metro', 'bus', 'train', 'auto'],
      'Shopping': ['shopping', 'amazon', 'flipkart', 'clothes', 'shoes', 'purchase'],
      'Bills & Utilities': ['bill', 'electricity', 'water', 'gas', 'internet', 'phone', 'recharge', 'wifi'],
      'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'concert', 'show'],
      'Healthcare': ['medicine', 'doctor', 'hospital', 'pharmacy', 'medical', 'health'],
      'Groceries': ['grocery', 'vegetables', 'fruits', 'milk', 'supermarket'],
      'Salary': ['salary', 'paycheck', 'wages'],
    };

    let suggestedCategory: string | undefined;
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        suggestedCategory = category;
        break;
      }
    }

    // Extract title - clean up the text
    let title = text
      .replace(/(?:rs\.?|₹|rupees?|inr)?\s*\d+(?:,\d{3})*(?:\.\d{1,2})?k?/gi, '')
      .replace(/(?:i\s+)?(?:spent|paid|bought|purchased|received|got|earned|for|on|at|the|a|an|um|uh|like|so)\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (title.length < 2) title = "Transaction";
    if (title.length > 50) title = title.substring(0, 50);

    return { title, amount, type, description: text, suggestedCategory };
  };

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={handleToggle}
          disabled={isParsing}
          className="gap-2 relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isParsing ? (
              <motion.div
                key="parsing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.div>
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <MicOff className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Mic className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
          {isParsing ? "Processing..." : isListening ? "Stop" : "Voice Input"}
        </Button>

        {isListening && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-2"
          >
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-4 bg-primary rounded-full"
                  animate={{ scaleY: [0.4, 1, 0.4] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8, 
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </span>
            <span className="text-sm text-muted-foreground">Listening...</span>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-lg bg-muted/50 border"
          >
            <p className="text-sm text-muted-foreground mb-1">Heard:</p>
            <p className="text-sm font-medium">"{transcript}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceTransactionInput;
