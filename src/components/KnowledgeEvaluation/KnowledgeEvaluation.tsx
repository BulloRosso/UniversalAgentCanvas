import React, { useEffect, useState } from 'react';
import { 
  BarChart
} from '@mui/x-charts';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Box,
  styled
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useStudent } from '../../context/StudentContext';
import { useTranslation } from 'react-i18next';

interface KnowledgeEvaluationProps {
  open: boolean;
  onClose: () => void;
}

interface StudentData {
  studentId: string;
  visitedLectures: string[];
  answeredQuestions: {
    lectureId: string;
    category: string;
    correctAnswer: boolean;
  }[];
}

interface CategorySummary {
  name: string;
  passed: number;
  failed: number;
}

// Create a styled component for the chart container
const StyledChartContainer = styled('div')(`
  g.MuiChartsAxis-directionY .MuiChartsAxis-tickLabel tspan {
    font-weight: bold;
    font-size: 16px;
  }
`);

const KnowledgeEvaluation: React.FC<KnowledgeEvaluationProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { studentId } = useStudent();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);

  const fetchAndProcessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<StudentData>(
        `${import.meta.env.VITE_API_URL}api/students/${studentId}`
      );

      // Process the data to get category summaries
      const categorySummaries = new Map<string, CategorySummary>();

      response.data.answeredQuestions.forEach(question => {
        if (!categorySummaries.has(question.category)) {
          categorySummaries.set(question.category, {
            name: question.category,
            passed: 0,
            failed: 0
          });
        }

        const summary = categorySummaries.get(question.category)!;
        if (question.correctAnswer) {
          summary.passed += 1;
        } else {
          summary.failed += 1;
        }
      });

      // Convert to array and sort by category name
      const sortedData = Array.from(categorySummaries.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setCategoryData(sortedData);
    } catch (err) {
      setError('Failed to load evaluation data');
      console.error('Error fetching knowledge evaluation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAndProcessData();
    }
  }, [open, studentId]);

  // Transform data to percentages
  const chartData = categoryData.map(group => {
    const total = group.passed + group.failed;
    const passedPercentage = total > 0 ? (group.passed / total) * 100 : 0;
    const failedPercentage = total > 0 ? (group.failed / total) * 100 : 0;

    return {
      name: `${t(group.name)} \n\n (${total})`,
      passed: passedPercentage,
      failed: failedPercentage
    };
  });

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            {error}
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        {t('Your Results')}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, minHeight: 500 }}>
        {chartData.length > 0 ? (
          <StyledChartContainer>
      <BarChart
            width={800}
            height={400}
            layout="horizontal"
            margin={{ left: 280, right: 10 }}
            series={[
              {
                dataKey: 'passed',
                label: t('Passed'),
                color: '#98c88f',
                stack: 'total'
              },
              {
                dataKey: 'failed',
                label: t('Failed'),
                color: 'gold',
                stack: 'total'
              }
            ]}
            yAxis={[
              {
                scaleType: 'band',
                data: chartData.map(item => item.name)
              }
            ]}
            xAxis={[
              {
                min: 0,
                max: 100,
              }
            ]}
            dataset={chartData}
            barLabel={(item) => {
              const value = item.value ?? 0;
              return value > 0 ? `${Math.round(value)}%` : '';
            }}
            slotProps={{
              legend: {
                direction: 'row',
                position: { vertical: 'top', horizontal: 'right' },
                padding: 8
              }
            }}
          />
          </StyledChartContainer>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            {t('No data available')}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KnowledgeEvaluation;