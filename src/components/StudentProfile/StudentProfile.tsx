// src/components/StudentProfile/StudentProfile.tsx
import React, { useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Chip,
  TextField,
  Grid
} from '@mui/material';
import {
  School,
  LocationOn,
  MenuBook,
  Book,
  Close,
  Stars,
  Edit,
  Save,
  Person,
  Fingerprint
} from '@mui/icons-material';
import { useStudent } from '../../context/StudentContext';
import { useTranslation } from 'react-i18next';

interface StudentProfileProps {
  open: boolean;
  onClose: () => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ open, onClose }) => {
  const student = useStudent();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({
    studentId: student.studentId,
    name: student.name,
    location: student.location
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    student.setStudentId(editedValues.studentId);
    student.setName(editedValues.name);
    student.setLocation(editedValues.location);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedValues({
      studentId: student.studentId,
      name: student.name,
      location: student.location
    });
    setIsEditing(false);
  };

  // Common styles for the three-column layout
  const fieldStyles = {
    display: 'grid',
    gridTemplateColumns: '24px 120px 1fr',
    alignItems: 'center',
    gap: 2,
    mb: 2
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography component="div" variant="h6">{t('studentProfile')}</Typography>
        <Box>
          {!isEditing ? (
            <IconButton onClick={handleEdit} sx={{ mr: 1 }}>
              <Edit sx={{ color: 'blue' }} />
            </IconButton>
          ) : (
            <>
              <IconButton onClick={handleSave} sx={{ mr: 1 }}>
                <Save sx={{ color: 'green' }} />
              </IconButton>
              <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
                <Close sx={{ color: 'red' }} />
              </IconButton>
            </>
          )}
          <IconButton onClick={onClose} sx={{ color: 'black' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={6}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School sx={{ color: 'black' }} />
                      <Typography component="div" variant="h6">{t('basicInformation')}</Typography>
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={fieldStyles}>
                    <Fingerprint sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                    <Typography variant="body1" color="text.secondary">{t('studentId')}</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editedValues.studentId}
                        onChange={(e) => setEditedValues(prev => ({ ...prev, studentId: e.target.value }))}
                      />
                    ) : (
                      <Typography variant="body1">{student.studentId}</Typography>
                    )}
                  </Box>
                  <Box sx={fieldStyles}>
                    <Person sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                    <Typography variant="body1" color="text.secondary">{t('name')}</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editedValues.name}
                        onChange={(e) => setEditedValues(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <Typography variant="body1">{student.name}</Typography>
                    )}
                  </Box>
                  <Box sx={fieldStyles}>
                    <LocationOn sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                    <Typography variant="body1" color="text.secondary">{t('location')}</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editedValues.location}
                        onChange={(e) => setEditedValues(prev => ({ ...prev, location: e.target.value }))}
                      />
                    ) : (
                      <Typography variant="body1">{student.location}</Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Current Progress */}
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MenuBook sx={{ color: 'black' }} />
                      <Typography variant="h6">{t('currentProgress')}</Typography>
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={fieldStyles}>
                    <Book sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                    <Typography variant="body1" color="text.secondary">{t('activeLecture')}</Typography>
                    <Typography variant="body1">{student.activeLecture}</Typography>
                  </Box>
                  <Box sx={fieldStyles}>
                    <Book sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                    <Typography variant="body1" color="text.secondary">{t('activeLesson')}</Typography>
                    <Typography variant="body1">{student.activeLesson}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right Column */}
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Stars sx={{ color: 'black' }} />
                    <Typography variant="h6">{t('answeredQuestions')}</Typography>
                  </Box>
                }
              />
              <Divider />
              <CardContent sx={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
                {student.answeredQuestions.length === 0 ? (
                  <Typography variant="body1" color="text.secondary">
                    {t('noQuestionsAnswered')}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {student.answeredQuestions.map((question) => (
                      <Chip
                        key={question.questionId}
                        label={`${question.questionId}: ${question.score} points`}
                        color={question.score > 0 ? "success" : "default"}
                        sx={{ width: 'fit-content' }}
                      />
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfile;