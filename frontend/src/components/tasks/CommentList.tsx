import React from 'react';
import { Box, Avatar, Typography, List, ListItem } from '@mui/material';
import { Comment } from '../../types/task';
import { format } from 'date-fns';

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <List>
      {comments.map((comment) => (
        <ListItem
          key={comment.id}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
            <Avatar
              src={comment.user?.avatar}
              alt={comment.user?.name || 'User'}
              sx={{ width: 32, height: 32, mr: 1 }}
            />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 'bold', color: '#fff' }}
              >
                {comment.user?.name || 'Anonymous User'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="body2"
            sx={{
              pl: 5,
              color: 'rgba(255, 255, 255, 0.9)',
              width: '100%',
            }}
          >
            {comment.content}
          </Typography>
        </ListItem>
      ))}
    </List>
  );
};

export default CommentList; 