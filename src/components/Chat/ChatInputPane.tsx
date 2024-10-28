// src/components/Chat/ChatInputPane.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  IconButton, 
  TextField,
  Paper,
  Button,
  Typography 
} from '@mui/material';
import { 
  Send, 
  AttachFile, 
  Mic, 
  Close,
  CloudUpload 
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Add Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: {
    item(index: number): {
      item(index: number): {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface ChatInputPaneProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  speechRecognitionLang: string;
}

export const ChatInputPane: React.FC<ChatInputPaneProps> = ({ 
  onSendMessage,
  disabled = false,
  speechRecognitionLang
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Stop existing recording when language changes
  useEffect(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [speechRecognitionLang]);
  
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up speech recognition if available
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = speechRecognitionLang; // Use the provided language
    console.log("Using Speech Recognition with language:", recognition.lang);
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setMessage(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      }

      // Set up media recorder
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setFiles(prevFiles => [...prevFiles, audioFile]);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
    }
  }, [speechRecognitionLang, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message, files);
      setMessage('');
      setFiles([]);
      setPreviews([]);
      setShowUploadArea(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (selectedFiles: File[]) => {
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    // Generate previews for images
    const newPreviews = selectedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
    setPreviews([...previews, ...newPreviews]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];

    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }

    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <>
      {showUploadArea && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            border: '2px dashed #ccc',
            backgroundColor: '#fafafa',
            opacity: disabled ? 0.7 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography flex={1}>
              Drag and drop files here or click to select
            </Typography>
            <Button
              variant="contained"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<CloudUpload />}
            >
              Select Files
            </Button>
          </Box>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            style={{ display: 'none' }}
          />

          {files.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {files.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'relative',
                    width: 100,
                    height: 100,
                    border: '1px solid #ccc',
                    borderRadius: 1,
                  }}
                >
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={file.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" align="center">
                        {file.name}
                      </Typography>
                    </Box>
                  )}
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: 'white',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                    onClick={() => handleRemoveFile(index)}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: 1,
          backgroundColor: '#fff',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <IconButton
          onClick={() => setShowUploadArea(!showUploadArea)}
          color={showUploadArea ? 'primary' : 'default'}
          disabled={disabled}
        >
          <AttachFile />
        </IconButton>

        <IconButton
          onClick={isRecording ? stopRecording : startRecording}
          color={isRecording ? 'error' : 'default'}
          disabled={disabled}
        >
          <Mic />
        </IconButton>

        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={disabled ? "Connecting..." : t('chat.input.placeholder')}
          disabled={disabled}
          sx={{ mx: 1 }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !disabled) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <IconButton 
          onClick={handleSend}
          color="primary"
          disabled={disabled || (!message.trim() && files.length === 0)}
        >
          <Send />
        </IconButton>
      </Box>
    </>
  );
};