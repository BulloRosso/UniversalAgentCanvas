import React from 'react';
import { 
  BarChart
} from '@mui/x-charts';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface KnowledgeEvaluationProps {
  open: boolean;
  onClose: () => void;
}

const KnowledgeEvaluation: React.FC<KnowledgeEvaluationProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const data = {
    questionGroups: [
      { name: "Category A with some additional text", passed: 20, failed: 10 },
      { name: "Category B", passed: 3, failed: 23 },
      { name: "Category C", passed: 4, failed: 0 }
    ]
  };

  // Transform data to percentages
  const chartData = data.questionGroups.map(group => {
    const total = group.passed + group.failed;
    const passedPercentage = total > 0 ? (group.passed / total) * 100 : 0;
    const failedPercentage = total > 0 ? (group.failed / total) * 100 : 100;

    return {
      name: `${group.name} \n\n (${group.passed + group.failed})`,
      passed: passedPercentage,
      failed: failedPercentage
    };
  });

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
        Your Results
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
        <BarChart
          width={800}
          height={400}
          layout="horizontal"
          margin={{ left: 280,right: 10 }}
          series={[
            {
              dataKey: 'passed',
              label: 'Passed',
              color: '#98c88f',
              stack: 'total'
            },
            {
              dataKey: 'failed',
              label: 'Failed',
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
              tickFormatter: (value) => `${value}%`
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
      </DialogContent>
    </Dialog>
  );
};

export default KnowledgeEvaluation;