import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

interface Project {
  id: string;
  name: string;
  icon?: string;
}

interface ProjectsSectionProps {
  projects: Project[];
  onCreateProject: () => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects, onCreateProject }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.primary' }}>
          Projects
        </Typography>
        <Typography 
          component="span" 
          variant="caption" 
          sx={{ 
            ml: 2,
            color: 'text.secondary',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Recents
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Create Project Card */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card 
            sx={{ 
              height: '100%',
              minHeight: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
              cursor: 'pointer',
              borderRadius: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
              }
            }}
            onClick={onCreateProject}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 24, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Create project
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Project Cards */}
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
            <Card sx={{ 
              height: '100%', 
              minHeight: 100,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.06)',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {project.icon ? (
                      <img src={project.icon} alt="" style={{ width: 24, height: 24 }} />
                    ) : (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: 'primary.main',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                          {project.name.charAt(0).toUpperCase()}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {project.name}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{ 
                      color: 'text.secondary',
                      padding: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}>Share</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectsSection; 