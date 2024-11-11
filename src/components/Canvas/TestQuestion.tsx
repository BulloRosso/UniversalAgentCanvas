import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Checkbox, 
  Button, 
  Paper,
  FormGroup
} from '@mui/material';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot 
} from 'react-beautiful-dnd';
import { EventBus, EVENTS } from '../../events/CustomEvents';

interface Choice {
  id: number;
  text: string;
}

interface QuestionProps {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'drag-and-drop';
  choices: Choice[];
  answerId: number[];
  points: number;
}

const reorder = (list: Choice[], startIndex: number, endIndex: number): Choice[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const move = (source: Choice[], destination: Choice[], droppableSource: any, droppableDestination: any) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);
  destClone.splice(droppableDestination.index, 0, removed);
  return [sourceClone, destClone];
};

const TestQuestion: React.FC<QuestionProps> = ({
  id,
  question,
  type,
  choices,
  answerId,
  points
}) => {
  const [selectedSingleAnswer, setSelectedSingleAnswer] = useState<string>('');
  const [selectedMultipleAnswers, setSelectedMultipleAnswers] = useState<number[]>([]);
  const [sourceItems, setSourceItems] = useState<Choice[]>([]);
  const [targetItems, setTargetItems] = useState<Choice[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (type === 'drag-and-drop') {
      setSourceItems(choices);
      setTargetItems([]);
    }
  }, [choices, type]);

  const getInstructions = () => {
    switch (type) {
      case 'single-choice':
        return 'Select one from the option buttons';
      case 'multiple-choice':
        return `Select ${answerId.length} from the check boxes`;
      case 'drag-and-drop':
        return 'Arrange the following items sorted by best to worst option or in the right order';
      default:
        return '';
    }
  };

  const handleSingleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSubmitted) {
      setSelectedSingleAnswer(event.target.value);
    }
  };

  const handleMultipleChoiceChange = (id: number) => {
    if (!isSubmitted) {
      setSelectedMultipleAnswers(prev => {
        if (prev.includes(id)) {
          return prev.filter(answerId => answerId !== id);
        }
        return [...prev, id];
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'droppable-source') {
        setSourceItems(prevItems => reorder(prevItems, source.index, destination.index));
      } else {
        setTargetItems(prevItems => reorder(prevItems, source.index, destination.index));
      }
    } else {
      if (destination.droppableId === 'droppable-target' && targetItems.length >= answerId.length) {
        return; // Prevent dropping if target already has max items
      }

      const [newSourceItems, newTargetItems] = move(
        source.droppableId === 'droppable-source' ? sourceItems : targetItems,
        source.droppableId === 'droppable-source' ? targetItems : sourceItems,
        source,
        destination
      );

      if (source.droppableId === 'droppable-source') {
        setSourceItems(newSourceItems);
        setTargetItems(newTargetItems);
      } else {
        setTargetItems(newSourceItems);
        setSourceItems(newTargetItems);
      }
    }
  };

  const generateResponseText = (isCorrect: boolean): string => {
    if (isCorrect) {
      return "#### Great! That is the right answer! 🎉";
    }

    let correctAnswerText = "";
    switch (type) {
      case 'single-choice':
        const correctChoice = choices.find(c => c.id === answerId[0]);
        correctAnswerText = `* ${correctChoice?.text}`;
        break;

      case 'multiple-choice':
        correctAnswerText = answerId
          .map(id => choices.find(c => c.id === id))
          .filter(choice => choice) // Remove any undefined values
          .map(choice => `* ${choice?.text}`)
          .join('\n');
        break;

      case 'drag-and-drop':
        correctAnswerText = answerId
          .map(id => choices.find(c => c.id === id))
          .filter(choice => choice) // Remove any undefined values
          .map((choice, index) => `${index + 1}. ${choice?.text}`)
          .join('\n');
        break;
    }

    return `#### Not quite correct

  The right answer would have been:

  ${correctAnswerText}`;
  };
  
  const handleSubmit = () => {
    const eventBus = EventBus.getInstance();
    let isCorrect = false;

    switch (type) {
      case 'single-choice':
        isCorrect = parseInt(selectedSingleAnswer) === answerId[0];
        break;
      case 'multiple-choice':
        isCorrect = selectedMultipleAnswers.length === answerId.length &&
          selectedMultipleAnswers.every(id => answerId.includes(id));
        break;
      case 'drag-and-drop':
        isCorrect = targetItems.map(item => item.id).join(',') === answerId.join(',');
        break;
    }
  
    eventBus.publish(EVENTS.ANSWER_EVENT, {
      questionId: id,
      points: isCorrect ? points : 0,
      responseText: generateResponseText(isCorrect),
    });

    setIsSubmitted(true);
  };

  const DraggableItem = ({ item, index }: { item: Choice; index: number }) => (
    <Draggable draggableId={`item-${item.id}`} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={snapshot.isDragging ? 6 : 1}
          sx={{
            p: 2,
            mb: 1,
            backgroundColor: snapshot.isDragging ? 'action.selected' : 'background.paper',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          {item.text}
        </Paper>
      )}
    </Draggable>
  );

  const DroppableArea = ({ 
    id, 
    items, 
    title 
  }: { 
    id: string; 
    items: Choice[]; 
    title: string; 
  }) => (
    <Box width="45%">
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Droppable droppableId={id} type="ITEM">
        {(provided: DroppableProvided) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 200,
              backgroundColor: 'background.paper',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2
            }}
          >
            {items.map((item, index) => (
              <DraggableItem key={item.id} item={item} index={index} />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );

  return (
    <Box sx={{ p: 3, maxWidth: '800px', minWidth: '800px', margin: 'auto' }}>
      <Typography variant="h6" align="left" gutterBottom>
        {question}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        {getInstructions()}
      </Typography>

      {type === 'single-choice' && (
        <RadioGroup 
          value={selectedSingleAnswer}
          onChange={handleSingleChoiceChange}
        >
          {choices.map((choice) => (
            <FormControlLabel
              key={choice.id}
              value={choice.id.toString()}
              control={<Radio />}
              label={choice.text}
              disabled={isSubmitted}
            />
          ))}
        </RadioGroup>
      )}

      {type === 'multiple-choice' && (
        <FormGroup>
          {choices.map((choice) => (
            <FormControlLabel
              key={choice.id}
              control={
                <Checkbox
                  checked={selectedMultipleAnswers.includes(choice.id)}
                  onChange={() => handleMultipleChoiceChange(choice.id)}
                  disabled={isSubmitted}
                />
              }
              label={choice.text}
            />
          ))}
        </FormGroup>
      )}

      {type === 'drag-and-drop' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Box display="flex" justifyContent="space-between" gap={4}>
            <DroppableArea
              id="droppable-source"
              items={sourceItems}
              title="Available Options:"
            />
            <DroppableArea
              id="droppable-target"
              items={targetItems}
              title="Your Answer:"
            />
          </Box>
        </DragDropContext>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isSubmitted}
        >
          Submit answer(s)
        </Button>
      </Box>
    </Box>
  );
};

export default TestQuestion;